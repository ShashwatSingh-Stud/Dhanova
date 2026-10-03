/**
 * RBICard — small dark card like "Annual plans" in reference.
 * Shows RBI 2026 alignment info: Rs 1,000 threshold, 60-day max hold, mini bar chart.
 */
'use client';

import { Card } from './Card';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

interface RBICardProps {
  activeHoldsByDaysRemaining: number[]; // e.g. [3, 7, 12, 8, 5] buckets
}

export function RBICard({ activeHoldsByDaysRemaining }: RBICardProps) {
  const chartData = activeHoldsByDaysRemaining.map((count, i) => ({
    bucket: `${i * 12}-${(i + 1) * 12}d`,
    count,
  }));

  return (
    <Card variant="dark" className="flex flex-col">
      <h3 className="text-sm font-semibold text-white mb-3">RBI 2026 Alignment</h3>

      <div className="space-y-2 text-sm">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between"
        >
          <span className="text-white/70">Suspicious txn threshold</span>
          <span className="font-semibold text-white">₹1,000</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between"
        >
          <span className="text-white/70">Max hold duration</span>
          <span className="font-semibold text-white">60 days</span>
        </motion.div>
      </div>

      <div className="mt-4 h-16">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={true}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="var(--color-teal)" opacity={0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-white/60 mt-1">Active holds by days remaining</p>
      </div>
    </Card>
  );
}
