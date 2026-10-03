/**
 * Dashboard — Bento grid with explicit grid-template-areas layout.
 *
 * Layout (matching reference UI middle theme):
 * Left column: HeroCard + ProgressCard
 * Middle column: BarChartCard + DonutCard (budget)
 * Right column: RadarCard + DonutCard (costs)
 * Bottom row: LineChartCard (wide) + RBICard (small)
 *
 * Stacks to single column on mobile.
 */
'use client';

import { motion } from 'framer-motion';
import { HeroCard } from '@/components/HeroCard';
import { ProgressCard } from '@/components/ProgressCard';
import { BarChartCard } from '@/components/BarChartCard';
import { DonutCard } from '@/components/DonutCard';
import { RadarCard } from '@/components/RadarCard';
import { LineChartCard } from '@/components/LineChartCard';
import { RBICard } from '@/components/RBICard';
import { useDashboardStats } from '@/lib/hooks/useData';
import { MOCK_TIME_SERIES } from '@/lib/mock-data';

export default function DashboardPage() {
  const { data: stats } = useDashboardStats();

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[--color-teal] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const progressItems = [
    { label: 'Recall vs 80% target', value: Math.round(stats.recall * 100), target: 80, max: 100 },
    { label: 'Active holds', value: stats.active_holds, max: 50 },
    { label: 'Rings detected', value: stats.rings_detected, max: 10 },
    { label: 'Avg review time (hrs)', value: Math.round(stats.avg_review_time_hours), target: 24, max: 48 },
  ];

  const budgetDonutData = [
    { name: 'Clear', value: stats.total_accounts - stats.flagged_count, color: 'var(--color-teal)' },
    { name: 'Flagged', value: stats.flagged_count - stats.accounts_on_hold, color: 'var(--color-risk-mid)' },
    { name: 'On Hold', value: stats.accounts_on_hold, color: 'var(--color-risk-high)' },
  ];

  const costsDonutData = [
    { name: 'Fan-out', value: 35, color: 'var(--color-risk-high)' },
    { name: 'Circular layering', value: 28, color: 'var(--color-risk-mid)' },
    { name: 'Burst timing', value: 22, color: 'var(--color-periwinkle)' },
    { name: 'Device reuse', value: 15, color: 'var(--color-teal)' },
  ];

  const radarData = [
    { feature: 'Velocity', value: 78, fullMark: 100 },
    { feature: 'Fan-out', value: 85, fullMark: 100 },
    { feature: 'Device reuse', value: 62, fullMark: 100 },
    { feature: 'Age', value: 71, fullMark: 100 },
    { feature: 'Burstiness', value: 68, fullMark: 100 },
  ];

  const sparklineData = [120, 145, 132, 178, 195, 168, 189];
  const activeHoldsByDays = [3, 7, 12, 8, 5]; // buckets: 0-12d, 12-24d, ...

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.07,
          },
        },
      }}
      className="dashboard-grid"
    >
      {/* Hero card */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        style={{ gridArea: 'hero' }}
      >
        <HeroCard
          totalFlaggedAmount={stats.total_flagged_amount}
          accountsOnHold={stats.accounts_on_hold}
          flaggedPercent={Math.round((stats.flagged_count / stats.total_accounts) * 100)}
          sparklineData={sparklineData}
        />
      </motion.div>

      {/* Progress/Goals card */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        style={{ gridArea: 'progress' }}
      >
        <ProgressCard title="Performance Goals" items={progressItems} />
      </motion.div>

      {/* Bar chart */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        style={{ gridArea: 'bar' }}
      >
        <BarChartCard
          title="Transaction Flow"
          tabs={['Flagged', 'Held', 'Cleared']}
          data={MOCK_TIME_SERIES}
        />
      </motion.div>

      {/* Budget donut (account status split) */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        style={{ gridArea: 'budget' }}
      >
        <DonutCard
          title="Account Status"
          centerValue={stats.rings_detected}
          centerLabel="Rings detected"
          data={budgetDonutData}
        />
      </motion.div>

      {/* Radar card */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        style={{ gridArea: 'radar' }}
      >
        <RadarCard title="Avg SHAP Features" data={radarData} />
      </motion.div>

      {/* Costs donut (fraud pattern breakdown) */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        style={{ gridArea: 'costs' }}
      >
        <DonutCard
          title="Fraud Patterns"
          centerValue="₹14.9Cr"
          centerLabel="Total detected"
          data={costsDonutData}
        />
      </motion.div>

      {/* Line chart (dark, wide) */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        style={{ gridArea: 'line' }}
      >
        <LineChartCard
          title="Transaction Volume vs Flagged"
          data={MOCK_TIME_SERIES}
          line1Key="volume"
          line1Label="Total volume"
          line2Key="flagged"
          line2Label="Flagged"
        />
      </motion.div>

      {/* RBI card (small dark) */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        style={{ gridArea: 'rbi' }}
      >
        <RBICard activeHoldsByDaysRemaining={activeHoldsByDays} />
      </motion.div>

      <style jsx>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          grid-template-rows: auto auto auto;
          gap: 24px;
          grid-template-areas:
            'hero hero hero hero bar bar bar bar radar radar radar radar'
            'progress progress progress progress budget budget budget budget costs costs costs costs'
            'line line line line line line line line rbi rbi rbi rbi';
        }

        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
            grid-template-areas:
              'hero'
              'progress'
              'bar'
              'radar'
              'budget'
              'costs'
              'line'
              'rbi';
          }
        }
      `}</style>
    </motion.div>
  );
}
