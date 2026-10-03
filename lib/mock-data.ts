/**
 * Synthetic mock data — activated when NEXT_PUBLIC_USE_MOCKS=true.
 *
 * 40 accounts, 5 rings, time-series for charts, cached Gemini explanations.
 * Covers all endpoints that the backend does NOT yet expose:
 *   GET /api/accounts/flagged
 *   GET /api/rings
 *   GET /api/graph/{account_id}
 *   POST /api/score/account/{account_id}
 *   Dashboard aggregate stats
 */

import type {
  FlaggedAccount,
  FraudRing,
  GraphData,
  HoldAction,
  DashboardStats,
  TimeSeriesPoint,
} from './types';

// ── Shared helpers ─────────────────────────────────────────────────────────

const BANKS = ['SBI', 'HDFC', 'ICICI', 'Axis', 'PNB', 'Kotak', 'BOI', 'Canara'];
const KYC_LEVELS = ['V0', 'V1', 'V2'];
const FIRST_NAMES = ['Rajesh', 'Priya', 'Suresh', 'Anita', 'Deepak', 'Kavya', 'Vikram', 'Meena',
  'Arjun', 'Sunita', 'Ravi', 'Pooja', 'Anil', 'Nisha', 'Kiran', 'Sanjay', 'Anjali', 'Mohan'];
const LAST_NAMES = ['Kumar', 'Sharma', 'Singh', 'Patel', 'Gupta', 'Verma', 'Rao', 'Nair', 'Das',
  'Joshi', 'Mehta', 'Shah', 'Reddy', 'Iyer', 'Pillai'];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}
function fmtDate(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 86400000);
  return d.toISOString();
}

// ── Gemini-style explanation snippets ─────────────────────────────────────

const EXPLANATIONS = [
  'This account shows a high fan-out pattern — sending money to 23 unique recipients within 48 hours — which is a strong indicator of mule activity. The account age of only 12 days and shared device fingerprint with 4 other flagged accounts significantly increases the risk.',
  'Circular layering detected: funds enter from external source and are split across multiple intermediary accounts before returning to related accounts. The burst timing at 2–4 AM combined with near-threshold transactions (₹9,800–₹9,950) suggests deliberate threshold evasion.',
  'High pass-through ratio (0.94) indicates this account acts primarily as a relay node. 87% of received funds are forwarded within 15 minutes. KYC level V0 with account age of 8 days heightens concern.',
  'Device reuse: this account shares a device fingerprint with accounts ACC-007 and ACC-019, both confirmed mule accounts. The shared device suggests coordinated operation by a single actor controlling multiple accounts.',
  'Burst activity pattern: 47 transactions in a 6-hour window, all below ₹10,000 (RBI suspicious threshold). The geographic spread of counterparties across 8 states with no prior relationship history matches known smurfing techniques.',
];

// ── Ring definitions (5 rings) ────────────────────────────────────────────

export const MOCK_RINGS: FraudRing[] = [
  {
    ring_id: 'RING-001',
    member_account_ids: ['ACC-001', 'ACC-002', 'ACC-003', 'ACC-008', 'ACC-012'],
    total_flow_amount: 4_850_000,
    detection_method: 'louvain',
    detected_at: fmtDate(2),
  },
  {
    ring_id: 'RING-002',
    member_account_ids: ['ACC-004', 'ACC-005', 'ACC-016', 'ACC-021'],
    total_flow_amount: 2_320_000,
    detection_method: 'burst',
    detected_at: fmtDate(5),
  },
  {
    ring_id: 'RING-003',
    member_account_ids: ['ACC-006', 'ACC-007', 'ACC-019', 'ACC-028', 'ACC-033'],
    total_flow_amount: 3_100_000,
    detection_method: 'device_reuse',
    detected_at: fmtDate(1),
  },
  {
    ring_id: 'RING-004',
    member_account_ids: ['ACC-009', 'ACC-011', 'ACC-024'],
    total_flow_amount: 1_750_000,
    detection_method: 'circular',
    detected_at: fmtDate(7),
  },
  {
    ring_id: 'RING-005',
    member_account_ids: ['ACC-013', 'ACC-014', 'ACC-015', 'ACC-031', 'ACC-038'],
    total_flow_amount: 2_900_000,
    detection_method: 'louvain',
    detected_at: fmtDate(3),
  },
];

// Map account → ring
const accountRingMap: Record<string, string> = {};
MOCK_RINGS.forEach((r) => {
  r.member_account_ids.forEach((id) => { accountRingMap[id] = r.ring_id; });
});

// ── 40 Accounts ──────────────────────────────────────────────────────────

function makeAccount(index: number): FlaggedAccount {
  const id = `ACC-${String(index + 1).padStart(3, '0')}`;
  // First 26 accounts are flagged/on_hold, rest are clear (used for rings list)
  const score = index < 8 ? randInt(80, 97)
    : index < 18 ? randInt(50, 79)
    : index < 26 ? randInt(30, 49)
    : randInt(5, 29);

  const status: FlaggedAccount['status'] = score >= 80
    ? (index % 3 === 0 ? 'on_hold' : 'flagged')
    : score >= 50 ? 'flagged'
    : 'clear';

  const expl = score >= 50 ? EXPLANATIONS[index % EXPLANATIONS.length] : null;

  return {
    account_id: id,
    holder_name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    bank_name: pick(BANKS),
    account_age_days: randInt(8, 1200),
    kyc_level: pick(KYC_LEVELS),
    status,
    score,
    ring_id: accountRingMap[id] ?? null,
    explanation_text: expl,
    top_features: [
      { feature: 'fan_out', direction: 'positive', contribution: +(Math.random() * 0.35).toFixed(3), value: randInt(5, 30) },
      { feature: 'pass_through_ratio', direction: 'positive', contribution: +(Math.random() * 0.25).toFixed(3), value: +(Math.random()).toFixed(2) },
      { feature: 'account_age_days', direction: 'positive', contribution: +(Math.random() * 0.20).toFixed(3), value: randInt(8, 120) },
      { feature: 'device_count', direction: 'positive', contribution: +(Math.random() * 0.15).toFixed(3), value: randInt(1, 5) },
      { feature: 'near_threshold_ratio', direction: 'positive', contribution: +(Math.random() * 0.10).toFixed(3), value: +(Math.random() * 0.9).toFixed(2) },
    ],
    computed_at: fmtDate(randInt(0, 3)),
  };
}

let _accounts: FlaggedAccount[] | null = null;
export function getMockAccounts(): FlaggedAccount[] {
  if (!_accounts) {
    // Use deterministic seed via index — no Math.random variance across renders
    _accounts = Array.from({ length: 40 }, (_, i) => makeAccount(i));
  }
  return _accounts;
}

// ── Dashboard stats ────────────────────────────────────────────────────────

export function getMockDashboardStats(): DashboardStats {
  const accounts = getMockAccounts();
  const flagged = accounts.filter(a => a.status === 'flagged' || a.status === 'on_hold');
  const onHold = accounts.filter(a => a.status === 'on_hold');
  return {
    total_flagged_amount: 14_920_000,   // INR - sum of ring flows
    accounts_on_hold: onHold.length,
    flagged_count: flagged.length,
    total_accounts: accounts.length,
    rings_detected: MOCK_RINGS.length,
    avg_review_time_hours: 18.4,
    recall: 0.84,
    active_holds: onHold.length,
  };
}

// ── Time series (7 days, hourly buckets per bar chart) ────────────────────

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const MOCK_TIME_SERIES: TimeSeriesPoint[] = DAY_LABELS.map((label, i) => ({
  label,
  flagged: [12, 19, 8, 24, 31, 17, 22][i],
  held: [3, 5, 2, 7, 9, 4, 6][i],
  cleared: [6, 11, 4, 14, 18, 9, 13][i],
  volume: [1200, 1800, 900, 2400, 3100, 1600, 2100][i],
}));

// ── Graph data for a ring ─────────────────────────────────────────────────

export function getMockGraph(accountId: string): GraphData {
  const accounts = getMockAccounts();
  const ringId = accountRingMap[accountId];
  const ring = MOCK_RINGS.find(r => r.ring_id === ringId);

  if (!ring) {
    // Isolated node
    const acc = accounts.find(a => a.account_id === accountId);
    return {
      nodes: acc
        ? [{ id: acc.account_id, label: acc.holder_name, score: acc.score, status: acc.status, degree: 0 }]
        : [],
      links: [],
    };
  }

  const members = ring.member_account_ids.map(id => {
    const acc = accounts.find(a => a.account_id === id);
    return acc
      ? { id: acc.account_id, label: acc.holder_name, score: acc.score, status: acc.status, degree: 0 }
      : { id, label: id, score: 0, status: 'clear' as const, degree: 0 };
  });

  // Build ring edges (cyclic + some cross-links)
  const links = members.map((node, i) => ({
    source: node.id,
    target: members[(i + 1) % members.length].id,
    amount: randInt(50_000, 500_000),
  }));

  // Degree counts
  const degreeMap: Record<string, number> = {};
  links.forEach(l => {
    degreeMap[l.source] = (degreeMap[l.source] ?? 0) + 1;
    degreeMap[l.target] = (degreeMap[l.target] ?? 0) + 1;
  });
  members.forEach(n => { n.degree = degreeMap[n.id] ?? 0; });

  return { nodes: members, links };
}

// ── Hold actions (for /holds page) ────────────────────────────────────────

export const MOCK_HOLD_ACTIONS: HoldAction[] = getMockAccounts()
  .filter(a => a.status === 'on_hold')
  .map((a, i) => {
    const start = new Date(Date.now() - randInt(1, 50) * 86400000);
    const expiry = new Date(start.getTime() + 60 * 86400000);
    return {
      action_id: `ACT-${String(i + 1).padStart(3, '0')}`,
      account_id: a.account_id,
      officer_id: `OFF-${randInt(1, 5).toString().padStart(3, '0')}`,
      reason: 'Suspected mule account — high fan-out ratio and shared device fingerprint.',
      hold_start: start.toISOString(),
      hold_expiry: expiry.toISOString(),
      status: 'active' as const,
    };
  });
