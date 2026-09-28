"""
Training script for Dhanova fraud detection model.
Trains XGBoost with group split, evaluates baselines, generates reports.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

import pandas as pd
import numpy as np
import json
from pathlib import Path
from sklearn.model_selection import GroupShuffleSplit
from sklearn.ensemble import IsolationForest
from sklearn.metrics import classification_report
import matplotlib.pyplot as plt
import warnings

warnings.filterwarnings('ignore')

from app.features import build_features, FEATURE_COLUMNS
from app.graph_engine import (
    build_graph, detect_communities, graph_features as compute_graph_features,
    ring_candidates, evaluate_rings, find_short_cycles
)
from app.scorer import RiskModel, evaluate_model
from app.explainer import explain, batch_explain

import shap


def load_data():
    """Load generated datasets."""
    print("Loading data...")

    data = {
        'accounts': pd.read_parquet('data/accounts.parquet'),
        'devices': pd.read_parquet('data/devices.parquet'),
        'account_devices': pd.read_parquet('data/account_devices.parquet'),
        'transactions': pd.read_parquet('data/transactions.parquet'),
        'labels': pd.read_parquet('data/labels.parquet'),
    }

    print(f"  Loaded {len(data['accounts'])} accounts, {len(data['transactions'])} transactions")
    print(f"  Fraud prevalence: {data['labels']['is_mule'].mean():.2%}")

    return data


def build_all_features(data):
    """Build behavior + graph features."""
    print("\nBuilding features...")

    # Behavior features
    print("  -> Behavior features...")
    behavior_features = build_features(
        data['transactions'],
        data['accounts'],
        data['account_devices'],
    )

    # Graph features
    print("  -> Graph analysis...")
    G = build_graph(data['transactions'])
    print(f"     Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

    communities = detect_communities(G, seed=42)
    print(f"     Detected {len(communities)} communities")

    rings = ring_candidates(G, communities)
    print(f"     Found {len(rings)} ring candidates")

    # Ring evaluation
    ring_eval = evaluate_rings(rings, data['labels'])
    print(f"     Ring Precision: {ring_eval['ring_precision']:.2%} | Ring Recall: {ring_eval['ring_recall']:.2%}")

    # Find cycles in top suspicious communities
    suspicious_nodes = []
    if len(rings) > 0:
        for members in rings.head(20)['members']:
            suspicious_nodes.extend(members)
    suspicious_nodes = list(set(suspicious_nodes))[:200]  # Limit for speed

    cycles = find_short_cycles(G, suspicious_nodes, max_len=4)
    print(f"     Found {len(cycles)} short cycles")

    g_features = compute_graph_features(G, communities, cycles)

    # Merge features
    print("  -> Merging features...")
    features = behavior_features.copy()
    for col in g_features.columns:
        if col in FEATURE_COLUMNS:
            features[col] = g_features[col]

    # Ensure all feature columns exist
    for col in FEATURE_COLUMNS:
        if col not in features.columns:
            features[col] = 0

    features = features[FEATURE_COLUMNS]

    print(f"  ✓ Features shape: {features.shape}")

    return features, rings, ring_eval


def split_data(features, labels):
    """Group-aware train/test split."""
    print("\nSplitting data (group-aware by ring_id)...")

    # Merge features with labels
    X = features
    y = labels.set_index('account_id')['is_mule'].astype(int)

    # Align
    common_idx = X.index.intersection(y.index)
    X = X.loc[common_idx]
    y = y.loc[common_idx]

    # Groups: ring_id for fraud accounts, account_id for normal
    groups = []
    for acc_id in X.index:
        label_row = labels[labels['account_id'] == acc_id].iloc[0]
        if label_row['is_mule']:
            groups.append(label_row['ring_id'])
        else:
            groups.append(acc_id)  # Each normal account is its own group

    groups = np.array(groups)

    # Group split
    gss = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups))

    X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
    y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
    groups_train = groups[train_idx]

    # Further split train into train/val
    gss_val = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx2, val_idx = next(gss_val.split(X_train, y_train, groups_train))

    X_val = X_train.iloc[val_idx]
    y_val = y_train.iloc[val_idx]
    X_train = X_train.iloc[train_idx2]
    y_train = y_train.iloc[train_idx2]

    print(f"  Train: {len(X_train)} ({y_train.sum()} fraud)")
    print(f"  Val: {len(X_val)} ({y_val.sum()} fraud)")
    print(f"  Test: {len(X_test)} ({y_test.sum()} fraud)")

    return X_train, X_val, X_test, y_train, y_val, y_test


def train_baselines(X_train, X_test, y_train, y_test):
    """Train baseline models."""
    print("\nTraining baselines...")

    baselines = {}

    # 1. Rule-based
    print("  -> Rule-based...")
    rule_preds = (
        (X_test['pass_through_ratio'] > 0.9) &
        (X_test['fan_in'] > 8) &
        (X_test['median_dwell_minutes'] < 30)
    ).astype(int)

    from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score

    baselines['rule_based'] = {
        'name': 'Rule-based',
        'precision': float(precision_score(y_test, rule_preds, zero_division=0)),
        'recall': float(recall_score(y_test, rule_preds, zero_division=0)),
        'f1_score': float(f1_score(y_test, rule_preds, zero_division=0)),
    }

    # 2. Isolation Forest
    print("  -> Isolation Forest...")
    iso_forest = IsolationForest(contamination=0.04, random_state=42, n_jobs=-1)
    iso_forest.fit(X_train)
    iso_scores = iso_forest.decision_function(X_test)
    iso_preds = (iso_scores < np.percentile(iso_scores, 4)).astype(int)

    baselines['isolation_forest'] = {
        'name': 'Isolation Forest',
        'precision': float(precision_score(y_test, iso_preds, zero_division=0)),
        'recall': float(recall_score(y_test, iso_preds, zero_division=0)),
        'f1_score': float(f1_score(y_test, iso_preds, zero_division=0)),
    }

    # 3. XGBoost without graph features (ablation)
    print("  -> XGBoost (no graph features)...")
    behavior_cols = [c for c in FEATURE_COLUMNS if c not in [
        'in_degree', 'out_degree', 'pagerank', 'clustering_coef',
        'community_size', 'community_internal_flow_ratio', 'community_density', 'in_short_cycle'
    ]]

    X_train_no_graph = X_train[behavior_cols]
    X_test_no_graph = X_test[behavior_cols]

    model_no_graph = RiskModel()

    # Simple train without validation split for ablation
    from sklearn.model_selection import train_test_split
    X_tr, X_vl, y_tr, y_vl = train_test_split(X_train_no_graph, y_train, test_size=0.2, random_state=42)

    model_no_graph.train(X_tr, y_tr, None, X_vl, y_vl)

    baselines['xgboost_no_graph'] = evaluate_model(model_no_graph, X_test_no_graph, y_test, name="XGBoost (no graph)")

    print("  ✓ Baselines trained")

    return baselines


def train_final_model(X_train, X_val, X_test, y_train, y_val, y_test):
    """Train final XGBoost model with all features."""
    print("\nTraining final model (XGBoost + graph features)...")

    model = RiskModel()
    groups_train = np.arange(len(X_train))  # Dummy groups for this phase

    model.train(X_train, y_train, groups_train, X_val, y_val)

    # Evaluate
    metrics = evaluate_model(model, X_test, y_test, name="XGBoost (final)")

    print(f"\n  Final Model Metrics:")
    print(f"    PR-AUC: {metrics['pr_auc']:.4f}")
    print(f"    ROC-AUC: {metrics['roc_auc']:.4f}")
    print(f"    Precision@50: {metrics['precision_at_50']:.2%}")
    print(f"    Recall@90% Precision: {metrics['recall_at_90pct_precision']:.2%}")
    print(f"    F1 Score: {metrics['f1_score']:.4f}")

    # Save model
    model.save('models')

    return model, metrics


def generate_reports(model, X_test, y_test, baselines, final_metrics, ring_eval):
    """Generate evaluation reports and plots."""
    print("\nGenerating reports...")

    Path('reports').mkdir(exist_ok=True)

    # Metrics JSON
    metrics_report = {
        'final_model': final_metrics,
        'baselines': baselines,
        'ring_detection': ring_eval,
        'test_set_size': int(len(X_test)),
        'test_fraud_count': int(y_test.sum()),
    }

    with open('reports/metrics.json', 'w') as f:
        json.dump(metrics_report, f, indent=2)

    print("  ✓ Saved reports/metrics.json")

    # Plots
    print("  -> Generating plots...")

    # 1. PR curve
    from sklearn.metrics import precision_recall_curve

    y_proba = model.predict_proba(X_test)
    precisions, recalls, _ = precision_recall_curve(y_test, y_proba)

    plt.figure(figsize=(8, 6))
    plt.plot(recalls, precisions, linewidth=2, label=f"Final Model (AUC={final_metrics['pr_auc']:.3f})")
    plt.xlabel('Recall')
    plt.ylabel('Precision')
    plt.title('Precision-Recall Curve')
    plt.legend()
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig('reports/pr_curve.png', dpi=150)
    plt.close()

    print("  ✓ Saved reports/pr_curve.png")

    # 2. SHAP summary plot
    print("  -> Computing SHAP values (this may take a minute)...")

    # Sample for SHAP (use smaller subset for speed)
    sample_size = min(500, len(X_test))
    X_sample = X_test.sample(n=sample_size, random_state=42)

    explainer = shap.TreeExplainer(model.model)
    shap_values = explainer.shap_values(X_sample)

    if isinstance(shap_values, list):
        shap_values = shap_values[1]

    plt.figure(figsize=(10, 8))
    shap.summary_plot(shap_values, X_sample, show=False, max_display=15)
    plt.tight_layout()
    plt.savefig('reports/shap_summary.png', dpi=150, bbox_inches='tight')
    plt.close()

    print("  ✓ Saved reports/shap_summary.png")

    # 3. Feature importance
    import xgboost as xgb

    plt.figure(figsize=(10, 8))
    xgb.plot_importance(model.model, max_num_features=15, importance_type='gain')
    plt.title('Feature Importance (Gain)')
    plt.tight_layout()
    plt.savefig('reports/feature_importance.png', dpi=150)
    plt.close()

    print("  ✓ Saved reports/feature_importance.png")

    print("\n✓ All reports generated in reports/")


def main():
    """Main training pipeline."""
    print("=" * 60)
    print("Dhanova Fraud Detection Model Training")
    print("=" * 60)

    # Load data
    data = load_data()

    # Build features
    features, rings, ring_eval = build_all_features(data)

    # Split data
    X_train, X_val, X_test, y_train, y_val, y_test = split_data(features, data['labels'])

    # Train baselines
    baselines = train_baselines(X_train, X_test, y_train, y_test)

    # Train final model
    model, final_metrics = train_final_model(X_train, X_val, X_test, y_train, y_val, y_test)

    # Generate reports
    generate_reports(model, X_test, y_test, baselines, final_metrics, ring_eval)

    # Test explanations
    print("\nGenerating sample explanations...")
    fraud_accounts = data['labels'][data['labels']['is_mule'] == True]['account_id'].head(3).values

    for acc_id in fraud_accounts:
        if acc_id in features.index:
            expl = explain(acc_id, features, model.model, top_k=5)
            print(f"\n{acc_id} (Score: {expl['score']}):")
            print(f"  {expl['explanation']}")

    print("\n" + "=" * 60)
    print("✓ Training complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("  1. Review metrics in reports/metrics.json")
    print("  2. Check plots in reports/")
    print("  3. Share reports/ with the pitch person for deck slides")
    print("  4. Hand off backend/app/*.py to backend engineer for API integration")


if __name__ == '__main__':
    main()
