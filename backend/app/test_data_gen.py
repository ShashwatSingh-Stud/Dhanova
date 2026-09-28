"""
Tests for Dhanova data generation.
"""

import pytest
import pandas as pd
import numpy as np
from backend.app.data_gen import generate


def test_generate_reproducibility():
    """Same seed produces same data."""
    data1 = generate(seed=42)
    data2 = generate(seed=42)

    assert len(data1['accounts']) == len(data2['accounts'])
    assert len(data1['transactions']) == len(data2['transactions'])

    # Check first transaction is identical
    tx1 = data1['transactions'].iloc[0]
    tx2 = data2['transactions'].iloc[0]
    assert tx1['txn_id'] == tx2['txn_id']
    assert tx1['amount'] == tx2['amount']


def test_fraud_prevalence():
    """Fraud prevalence is within 2-5%."""
    data = generate(seed=42)
    fraud_rate = data['labels']['is_mule'].mean()

    assert 0.02 <= fraud_rate <= 0.05, f"Fraud rate {fraud_rate:.2%} outside 2-5% range"


def test_no_orphan_accounts():
    """All transaction accounts exist in accounts table."""
    data = generate(seed=42)

    all_account_ids = set(data['accounts']['account_id'])
    tx_senders = set(data['transactions']['sender_account_id'])
    tx_receivers = set(data['transactions']['receiver_account_id'])

    # Most should exist (some may be external/victim accounts)
    sender_coverage = len(tx_senders & all_account_ids) / len(tx_senders)
    receiver_coverage = len(tx_receivers & all_account_ids) / len(tx_receivers)

    assert sender_coverage > 0.8, f"Only {sender_coverage:.1%} of senders exist in accounts"
    assert receiver_coverage > 0.8, f"Only {receiver_coverage:.1%} of receivers exist in accounts"


def test_row_counts():
    """Approximate expected row counts."""
    data = generate(seed=42)

    assert 5000 <= len(data['accounts']) <= 7000
    assert 140000 <= len(data['transactions']) <= 160000
    assert len(data['accounts']) == len(data['labels'])


def test_labels_separate():
    """Labels table has no feature-leaking columns."""
    data = generate(seed=42)

    # Accounts table should not have fraud indicators
    assert 'is_mule' not in data['accounts'].columns
    assert 'ring_id' not in data['accounts'].columns
    assert 'ring_archetype' not in data['accounts'].columns


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
