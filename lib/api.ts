/**
 * Typed API client for RakshaNet backend.
 * Base URL: NEXT_PUBLIC_API_URL env var.
 *
 * Routes marked [MOCK] don't exist in the backend yet;
 * they are intercepted by lib/mock-data.ts when
 * NEXT_PUBLIC_USE_MOCKS=true.
 */
import type {
  FlaggedAccount,
  RiskScore,
  FraudRing,
  GraphData,
  HoldRequest,
  HoldAction,
  ChatRequest,
  ChatResponse,
  CitizenCheckRequest,
  CitizenCheckResponse,
} from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ── [MOCK] GET /api/accounts/flagged ─────────────────────────────────────────
// Backend has no such endpoint; backend only has /upi/check/{id} per account.
export function fetchFlaggedAccounts(): Promise<FlaggedAccount[]> {
  return request('/api/accounts/flagged');
}

// ── [MOCK] GET /api/graph/{account_id} ───────────────────────────────────────
// graph_engine.py exists but is not exposed via REST.
export function fetchGraph(accountId: string): Promise<GraphData> {
  return request(`/api/graph/${accountId}`);
}

// ── [MOCK] GET /api/rings ────────────────────────────────────────────────────
// Ring detection exists in ML layer; no /rings endpoint yet.
export function fetchRings(): Promise<FraudRing[]> {
  return request('/api/rings');
}

// ── [MOCK] POST /api/score/account/{account_id} ──────────────────────────────
// Scoring is internal; citizen check is GET /upi/check/{id}.
export function scoreAccount(accountId: string): Promise<RiskScore> {
  return request(`/api/score/account/${accountId}`, { method: 'POST' });
}

// ── POST /actions/hold (REAL) ─────────────────────────────────────────────────
// Exists at /actions/hold. Note: release endpoint takes action_id in path.
export function holdAccount(payload: HoldRequest): Promise<HoldAction> {
  return request('/actions/hold', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ── POST /actions/release/{action_id} (REAL, thin adapter) ───────────────────
export function releaseAccount(actionId: string): Promise<{ message: string; account_id: string }> {
  return request(`/actions/release/${actionId}`, { method: 'POST' });
}

// ── POST /chat/ (REAL) ────────────────────────────────────────────────────────
export function sendChatMessage(payload: ChatRequest): Promise<ChatResponse> {
  return request('/chat/', { method: 'POST', body: JSON.stringify(payload) });
}

// ── GET /upi/check/{account_id} → citizen portal adapter ────────────────────
// The backend has GET /upi/check/{id}; PRD spec says POST /citizen/check-upi.
// We adapt here: map UPI id to account_id lookup.
export function citizenCheckUpi(
  payload: CitizenCheckRequest,
): Promise<CitizenCheckResponse> {
  // The backend scores by account_id; the citizen portal submits a upi_id.
  // Until a dedicated endpoint exists, we call the GET route with the upi_id used as account_id.
  return request(`/upi/check/${encodeURIComponent(payload.upi_id)}`).then(
    (score: RiskScore) => ({
      verdict: score.score >= 50 ? 'risky' : 'safe',
      score: score.score,
      reason: score.explanation_text ?? 'No explanation available.',
    }),
  );
}
