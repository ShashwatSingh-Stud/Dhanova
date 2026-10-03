/**
 * TypeScript types mirroring backend Pydantic schemas (schemas/domain.py)
 * and extended for frontend-only shapes (rings, graph) that the backend
 * does not yet expose via REST.
 */

// ── Accounts ───────────────────────────────────────────────────────────────

export type AccountStatus = 'clear' | 'flagged' | 'on_hold';

/** Mirrors AccountDetail Pydantic model */
export interface Account {
  account_id: string;
  holder_name: string;
  bank_name: string;
  account_age_days: number;
  kyc_level: string;
  status: AccountStatus;
}

/** Account enriched with its latest risk score (joined on frontend/mock) */
export interface FlaggedAccount extends Account {
  score: number;            // 0-100
  ring_id: string | null;
  explanation_text: string | null;
  top_features: ShapFeature[];
  computed_at: string;      // ISO datetime
}

// ── Risk Scores ─────────────────────────────────────────────────────────────

/** Single SHAP feature contribution */
export interface ShapFeature {
  feature: string;
  direction: 'positive' | 'negative';  // positive = raises risk
  contribution: number;                // absolute SHAP value
  value: number;                       // raw feature value
}

/** Mirrors RiskScoreResponse Pydantic model */
export interface RiskScore {
  account_id: string;
  score: number;
  top_features: { band: string; shap: ShapFeature[] };
  explanation_text: string | null;
  ring_id: string | null;
  computed_at: string;
}

// Risk band helpers
export type RiskBand = 'high' | 'mid' | 'low';
export function getRiskBand(score: number): RiskBand {
  if (score >= 80) return 'high';
  if (score >= 50) return 'mid';
  return 'low';
}

// ── Fraud Rings ─────────────────────────────────────────────────────────────

/** Frontend type — backend does not yet expose /api/rings */
export interface FraudRing {
  ring_id: string;
  member_account_ids: string[];
  total_flow_amount: number;
  detection_method: 'louvain' | 'burst' | 'device_reuse' | 'circular';
  detected_at: string;      // ISO datetime
}

// ── Graph ────────────────────────────────────────────────────────────────────

/** Node for react-force-graph-2d */
export interface GraphNode {
  id: string;
  label: string;
  score: number;
  status: AccountStatus;
  degree: number;
}

/** Edge for react-force-graph-2d */
export interface GraphEdge {
  source: string;
  target: string;
  amount: number;   // edge weight
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphEdge[];
}

// ── Hold Actions ─────────────────────────────────────────────────────────────

/** Mirrors HoldActionRequest Pydantic model */
export interface HoldRequest {
  account_id: string;
  reason: string;
  officer_id: string;
}

/** Mirrors HoldActionResponse Pydantic model */
export interface HoldAction {
  action_id: string;
  account_id: string;
  officer_id: string;
  reason: string;
  hold_start: string;   // ISO datetime
  hold_expiry: string;  // hold_start + 60 days
  status: 'active' | 'released' | 'expired';
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatRequest {
  account_id: string;
  question: string;
}

export interface ChatResponse {
  answer: string;
}

// ── Citizen ──────────────────────────────────────────────────────────────────

export interface CitizenCheckRequest {
  upi_id: string;
}

export interface CitizenCheckResponse {
  verdict: 'safe' | 'risky';
  score: number;
  reason: string;
}

// ── Dashboard aggregates (no backend endpoint — composed on frontend) ─────────

export interface DashboardStats {
  total_flagged_amount: number;    // INR
  accounts_on_hold: number;
  flagged_count: number;
  total_accounts: number;
  rings_detected: number;
  avg_review_time_hours: number;
  recall: number;                  // 0-1
  active_holds: number;
}

export interface TimeSeriesPoint {
  label: string;   // e.g. "Mon", "Jan 3"
  flagged: number;
  held: number;
  cleared: number;
  volume: number;
}
