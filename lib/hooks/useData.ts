/**
 * TanStack Query hooks — thin wrappers that route to mock data
 * when NEXT_PUBLIC_USE_MOCKS=true, or to the real API client otherwise.
 */
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';
import type { HoldRequest } from '../types';

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

// ── Lazy-loaded mock module (tree-shaken in production) ───────────────────

async function getMocks() {
  if (!USE_MOCKS) throw new Error('Mocks disabled');
  return import('../mock-data');
}

// ── Accounts ──────────────────────────────────────────────────────────────

export function useFlaggedAccounts() {
  return useQuery({
    queryKey: ['accounts', 'flagged'],
    queryFn: async () => {
      if (USE_MOCKS) {
        const m = await getMocks();
        return m.getMockAccounts().filter(a => a.status !== 'clear');
      }
      return api.fetchFlaggedAccounts();
    },
    staleTime: 30_000,
  });
}

export function useAllAccounts() {
  return useQuery({
    queryKey: ['accounts', 'all'],
    queryFn: async () => {
      if (USE_MOCKS) {
        const m = await getMocks();
        return m.getMockAccounts();
      }
      return api.fetchFlaggedAccounts();
    },
    staleTime: 30_000,
  });
}

// ── Rings ─────────────────────────────────────────────────────────────────

export function useRings() {
  return useQuery({
    queryKey: ['rings'],
    queryFn: async () => {
      if (USE_MOCKS) {
        const m = await getMocks();
        return m.MOCK_RINGS;
      }
      return api.fetchRings();
    },
    staleTime: 60_000,
  });
}

// ── Graph ─────────────────────────────────────────────────────────────────

export function useGraph(accountId: string | null) {
  return useQuery({
    queryKey: ['graph', accountId],
    queryFn: async () => {
      if (!accountId) return null;
      if (USE_MOCKS) {
        const m = await getMocks();
        return m.getMockGraph(accountId);
      }
      return api.fetchGraph(accountId);
    },
    enabled: !!accountId,
    staleTime: 60_000,
  });
}

// ── Dashboard stats ────────────────────────────────────────────────────────

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      if (USE_MOCKS) {
        const m = await getMocks();
        return m.getMockDashboardStats();
      }
      // No backend aggregate endpoint — always derived locally
      const accounts = await api.fetchFlaggedAccounts();
      const onHold = accounts.filter(a => a.status === 'on_hold');
      return {
        total_flagged_amount: 0,
        accounts_on_hold: onHold.length,
        flagged_count: accounts.length,
        total_accounts: accounts.length,
        rings_detected: 0,
        avg_review_time_hours: 0,
        recall: 0,
        active_holds: onHold.length,
      };
    },
    staleTime: 30_000,
  });
}

// ── Hold / Release (mutations) ─────────────────────────────────────────────

export function useHoldAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: HoldRequest) => api.holdAccount(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useReleaseAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (actionId: string) => api.releaseAccount(actionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ── Chat ──────────────────────────────────────────────────────────────────

export function useSendChat() {
  return useMutation({
    mutationFn: api.sendChatMessage,
  });
}

// ── Hold actions (for /holds page) ────────────────────────────────────────

export function useHoldActions() {
  return useQuery({
    queryKey: ['hold-actions'],
    queryFn: async () => {
      if (USE_MOCKS) {
        const m = await getMocks();
        return m.MOCK_HOLD_ACTIONS;
      }
      // Backend has no GET /hold_actions list endpoint yet — return empty
      return [];
    },
    staleTime: 10_000,
  });
}
