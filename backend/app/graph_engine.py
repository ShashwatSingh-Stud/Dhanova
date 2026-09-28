"""
Graph-based fraud ring detection for Dhanova.
Builds transaction graph, detects communities, finds rings.
"""

import networkx as nx
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from datetime import datetime


def build_graph(
    transactions: pd.DataFrame,
    as_of: Optional[datetime] = None,
) -> nx.DiGraph:
    """
    Build weighted directed transaction graph.

    Args:
        transactions: DataFrame with [sender_account_id, receiver_account_id,
                      amount, timestamp]
        as_of: Optional cutoff timestamp

    Returns:
        Directed graph with aggregated edges (weight=total amount, count, timestamps)
    """
    # Filter by as_of
    if as_of is not None:
        tx = transactions[transactions['timestamp'] <= as_of].copy()
    else:
        tx = transactions.copy()

    G = nx.DiGraph()

    # Aggregate edges (sender -> receiver)
    edge_agg = tx.groupby(['sender_account_id', 'receiver_account_id']).agg({
        'amount': 'sum',
        'txn_id': 'count',
        'timestamp': ['min', 'max'],
    }).reset_index()

    edge_agg.columns = ['sender', 'receiver', 'weight', 'count', 'first_ts', 'last_ts']

    # Add edges
    for _, row in edge_agg.iterrows():
        G.add_edge(
            row['sender'],
            row['receiver'],
            weight=row['weight'],
            count=row['count'],
            first_ts=row['first_ts'],
            last_ts=row['last_ts'],
        )

    return G


def detect_communities(G: nx.DiGraph, seed: int = 42) -> List[set]:
    """
    Detect communities using Louvain algorithm.

    Args:
        G: Directed graph
        seed: Random seed

    Returns:
        List of communities (sets of account_ids)
    """
    # Convert to undirected for community detection
    G_undirected = G.to_undirected()
    if G_undirected.number_of_nodes() == 0:
        return []

    # Louvain community detection (built into networkx 3.2+)
    communities = nx.community.louvain_communities(
        G_undirected,
        weight='weight',
        seed=seed,
    )

    return communities


def find_short_cycles(
    G: nx.DiGraph,
    node_subset: List[str],
    max_len: int = 4,
) -> List[List[str]]:
    """
    Find short cycles (2-4 nodes) in a subgraph.

    Args:
        G: Directed graph
        node_subset: Nodes to check (suspicious accounts only, not whole graph)
        max_len: Maximum cycle length

    Returns:
        List of cycles (each cycle is a list of account_ids)
    """
    # Create subgraph
    subgraph = G.subgraph(node_subset)

    # Find simple cycles up to max_len
    cycles = []
    try:
        for cycle in nx.simple_cycles(subgraph, length_bound=max_len):
            if 2 <= len(cycle) <= max_len:
                cycles.append(cycle)
    except Exception as e:
        print(f"Warning: cycle detection failed: {e}")
        return []

    return cycles


def ring_candidates(
    G: nx.DiGraph,
    communities: List[set],
    min_size: int = 3,
    max_size: int = 50,
) -> pd.DataFrame:
    """
    Filter communities to find fraud ring candidates.

    Criteria:
    - Size between min_size and max_size
    - High internal flow ratio (money stays within community)
    - High pass-through (money doesn't accumulate)
    - Short time span (burst activity)

    Args:
        G: Transaction graph
        communities: List of communities
        min_size: Minimum ring size
        max_size: Maximum ring size

    Returns:
        DataFrame with [ring_id, members, ring_score, total_flow, internal_ratio, ...]
    """
    candidates = []

    for idx, community in enumerate(communities):
        size = len(community)

        if not (min_size <= size <= max_size):
            continue

        # Get subgraph
        subgraph = G.subgraph(community)

        # Total flow amount
        total_internal_flow = sum(
            data['weight'] for _, _, data in subgraph.edges(data=True)
        )

        # External edges (in/out of community)
        external_in = 0
        external_out = 0

        for node in community:
            # In-edges from outside
            for pred in G.predecessors(node):
                if pred not in community:
                    external_in += G[pred][node]['weight']

            # Out-edges to outside
            for succ in G.successors(node):
                if succ not in community:
                    external_out += G[node][succ]['weight']

        total_flow = total_internal_flow + external_in + external_out

        if total_flow == 0:
            continue

        internal_flow_ratio = total_internal_flow / total_flow if total_flow > 0 else 0

        # Pass-through (how much goes out vs comes in)
        if external_in > 0:
            pass_through = external_out / external_in
        else:
            pass_through = 0

        # Time span (first to last transaction)
        timestamps = []
        for u, v, data in subgraph.edges(data=True):
            timestamps.append(data['first_ts'])
            timestamps.append(data['last_ts'])

        if timestamps:
            time_span_hours = (max(timestamps) - min(timestamps)).total_seconds() / 3600
        else:
            time_span_hours = 0

        # Ring score (heuristic)
        # High internal flow + short time span + medium-high pass-through = suspicious
        ring_score = (
            internal_flow_ratio * 40 +
            (1 / (1 + time_span_hours / 24)) * 30 +  # Shorter span = higher score
            min(pass_through, 1.0) * 30
        )

        candidates.append({
            'ring_id': f'R_{idx:03d}',
            'members': list(community),
            'size': size,
            'ring_score': ring_score,
            'total_flow_amount': total_flow,
            'internal_flow_ratio': internal_flow_ratio,
            'pass_through': pass_through,
            'time_span_hours': time_span_hours,
        })

    if not candidates:
        return pd.DataFrame()

    rings_df = pd.DataFrame(candidates).sort_values('ring_score', ascending=False)

    return rings_df


def graph_features(
    G: nx.DiGraph,
    communities: List[set],
    cycles: List[List[str]],
) -> pd.DataFrame:
    """
    Compute graph features for all nodes.

    Features:
    - in_degree, out_degree
    - pagerank
    - clustering_coef
    - community_size
    - community_internal_flow_ratio
    - community_density
    - in_short_cycle (0/1)

    Args:
        G: Transaction graph
        communities: Detected communities
        cycles: Short cycles found

    Returns:
        DataFrame indexed by account_id with graph features
    """
    all_nodes = list(G.nodes())
    if not all_nodes:
        return pd.DataFrame(columns=[
            'in_degree', 'out_degree', 'pagerank', 'clustering_coef',
            'community_size', 'community_internal_flow_ratio',
            'community_density', 'in_short_cycle'
        ], index=pd.Index([], name='account_id'))

    # Degree
    in_degrees = dict(G.in_degree())
    out_degrees = dict(G.out_degree())

    # PageRank (weighted)
    try:
        pagerank = nx.pagerank(G, weight='weight', max_iter=100)
    except:
        pagerank = {node: 1.0 / len(all_nodes) for node in all_nodes}

    # Clustering coefficient (undirected)
    G_undirected = G.to_undirected()
    clustering = nx.clustering(G_undirected)

    # Community membership
    node_to_community = {}
    community_sizes = {}

    for idx, community in enumerate(communities):
        community_sizes[idx] = len(community)
        for node in community:
            node_to_community[node] = idx

    # Community internal flow ratio
    community_internal_ratio = {}

    for idx, community in enumerate(communities):
        subgraph = G.subgraph(community)
        internal_flow = sum(data['weight'] for _, _, data in subgraph.edges(data=True))

        # External flow
        external = 0
        for node in community:
            for pred in G.predecessors(node):
                if pred not in community:
                    external += G[pred][node]['weight']
            for succ in G.successors(node):
                if succ not in community:
                    external += G[node][succ]['weight']

        total = internal_flow + external
        community_internal_ratio[idx] = internal_flow / total if total > 0 else 0

    # Community density
    community_density = {}

    for idx, community in enumerate(communities):
        subgraph = G.subgraph(community)
        n = len(community)
        if n > 1:
            max_edges = n * (n - 1)  # Directed
            actual_edges = subgraph.number_of_edges()
            community_density[idx] = actual_edges / max_edges
        else:
            community_density[idx] = 0

    # In short cycle
    nodes_in_cycles = set()
    for cycle in cycles:
        nodes_in_cycles.update(cycle)

    # Build features DataFrame
    features_list = []

    for node in all_nodes:
        comm_idx = node_to_community.get(node, -1)

        features_list.append({
            'account_id': node,
            'in_degree': in_degrees.get(node, 0),
            'out_degree': out_degrees.get(node, 0),
            'pagerank': pagerank.get(node, 0),
            'clustering_coef': clustering.get(node, 0),
            'community_size': community_sizes.get(comm_idx, 0),
            'community_internal_flow_ratio': community_internal_ratio.get(comm_idx, 0),
            'community_density': community_density.get(comm_idx, 0),
            'in_short_cycle': 1 if node in nodes_in_cycles else 0,
        })

    features_df = pd.DataFrame(features_list).set_index('account_id')

    return features_df


def evaluate_rings(
    detected_rings: pd.DataFrame,
    labels: pd.DataFrame,
) -> Dict[str, float]:
    """
    Evaluate ring detection performance.

    A detected ring is "correct" if at least 70% of its members are from the same
    ground-truth fraud ring.

    Args:
        detected_rings: DataFrame with [ring_id, members, ...]
        labels: DataFrame with [account_id, is_mule, ring_id, ring_archetype]

    Returns:
        Dict with precision, recall, and counts
    """
    if len(detected_rings) == 0:
        return {
            'ring_precision': 0.0,
            'ring_recall': 0.0,
            'detected_count': 0,
            'true_positive_count': 0,
            'ground_truth_count': labels[labels['is_mule'] == True]['ring_id'].nunique(),
        }

    # Ground truth rings
    true_rings = labels[labels['is_mule'] == True].groupby('ring_id')['account_id'].apply(set).to_dict()

    true_positive_rings = 0

    for _, detected_row in detected_rings.iterrows():
        detected_members = set(detected_row['members'])

        # Check overlap with each true ring
        best_overlap = 0
        for true_ring_id, true_members in true_rings.items():
            overlap = len(detected_members & true_members) / len(detected_members)
            best_overlap = max(best_overlap, overlap)

        # If ≥70% overlap with any true ring, count as TP
        if best_overlap >= 0.7:
            true_positive_rings += 1

    precision = true_positive_rings / len(detected_rings) if len(detected_rings) > 0 else 0

    # Recall: how many true rings were detected?
    detected_true_rings = 0

    for true_ring_id, true_members in true_rings.items():
        for _, detected_row in detected_rings.iterrows():
            detected_members = set(detected_row['members'])
            overlap = len(detected_members & true_members) / len(true_members)

            if overlap >= 0.7:
                detected_true_rings += 1
                break

    recall = detected_true_rings / len(true_rings) if len(true_rings) > 0 else 0

    return {
        'ring_precision': precision,
        'ring_recall': recall,
        'detected_count': len(detected_rings),
        'true_positive_count': true_positive_rings,
        'ground_truth_count': len(true_rings),
    }


if __name__ == '__main__':
    # Test with generated data
    import os

    if os.path.exists('data/transactions.parquet'):
        print("Testing graph engine...")

        tx = pd.read_parquet('data/transactions.parquet')
        labels = pd.read_parquet('data/labels.parquet')

        print("  -> Building graph...")
        G = build_graph(tx)
        print(f"     Nodes: {G.number_of_nodes()}, Edges: {G.number_of_edges()}")

        print("  -> Detecting communities...")
        communities = detect_communities(G, seed=42)
        print(f"     Found {len(communities)} communities")

        print("  -> Finding ring candidates...")
        rings = ring_candidates(G, communities)
        print(f"     Found {len(rings)} ring candidates")

        if len(rings) > 0:
            print(f"\nTop 5 rings by score:")
            print(rings.head()[['ring_id', 'size', 'ring_score', 'internal_flow_ratio']])

        print("\n  -> Evaluating ring detection...")
        eval_results = evaluate_rings(rings, labels)
        print(f"     Ring Precision: {eval_results['ring_precision']:.2%}")
        print(f"     Ring Recall: {eval_results['ring_recall']:.2%}")
        print(f"     Detected: {eval_results['detected_count']} | True Positives: {eval_results['true_positive_count']} | Ground Truth: {eval_results['ground_truth_count']}")

        print("\n  -> Computing graph features...")
        # Find cycles in suspicious communities (top 10 by ring score)
        suspicious_nodes = []
        if len(rings) > 0:
            for members in rings.head(10)['members']:
                suspicious_nodes.extend(members)

        cycles = find_short_cycles(G, suspicious_nodes[:100], max_len=4)  # Limit for speed
        print(f"     Found {len(cycles)} short cycles")

        g_features = graph_features(G, communities, cycles)
        print(f"     Graph features shape: {g_features.shape}")
        print(f"\nSample graph features:")
        print(g_features.head())
    else:
        print("Run data_gen.py first to generate test data")
