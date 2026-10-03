'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavBar, type Period } from '@/components/NavBar';
import { useState, type ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * Dashboard shell: wraps officer routes (Dashboard, Accounts, Rings, Holds)
 * with the top nav bar, period selector, and TanStack Query provider.
 *
 * The /citizen route bypasses this layout and renders directly.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<Period>('7d');

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen px-6 py-6">
        <div className="mx-auto max-w-[1440px] space-y-6">
          <NavBar period={period} onPeriodChange={setPeriod} />
          <main>{children}</main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
