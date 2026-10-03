/**
 * HeroCard — large dark card with the main KPIs.
 * Shows: total flagged amount, accounts on hold count, detection load ring, sparkline.
 */
'use client';

import { Card } from './Card';
import { StatCard } from './StatCard';
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface HeroCardProps {
  totalFlaggedAmount: number;
  accountsOnHold: number;
  flaggedPercent: number;  // for detection load ring
  sparklineData: number[]; // simple array of values
}

export function HeroCard({
  totalFlaggedAmount,
  accountsOnHold,
  flaggedPercent,
  sparklineData,
}: HeroCardProps) {
  // Map sparkline data to chart format
  const chartData = sparklineData.map((value, index) => ({ index, value }));

  return (
    <Card variant="dark" className="relative overflow-hidden">
      {/* Gradient background accent */}
      <div
        className="absolute top-0 right-0 w-48 h-48 opacity-20 blur-3xl rounded-full"
        style={{ background: 'radial-gradient(circle, var(--color-teal-bright), transparent)' }}
      />

      <div className="relative z-10 space-y-4">
        <StatCard
          label="Total Flagged Amount"
          value={totalFlaggedAmount}
          format="currency"
          className="text-white"
        />

        <div className="flex items-center gap-6">
          <StatCard
            label="Accounts on Hold"
            value={accountsOnHold}
            subtitle="Active holds"
          />

          {/* Detection load ring (simple circle progress) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="relative"
          >
            <svg width="64" height="64" viewBox="0 0 64 64">
              {/* Background circle */}
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="4"
              />
              {/* Progress circle */}
              <motion.circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="var(--color-teal-bright)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 28}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - flaggedPercent / 100) }}
                transition={{ duration: 1, ease: 'easeOut' }}
                transform="rotate(-90 32 32)"
              />
              {/* Center text */}
              <text
                x="32"
                y="36"
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                fill="white"
              >
                {flaggedPercent}%
              </text>
            </svg>
            <p className="text-xs text-center text-white/70 mt-1">Detection load</p>
          </motion.div>
        </div>

        {/* Sparkline */}
        <div className="h-12 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-teal-bright)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-white/60 mt-1">Flagged flow over time</p>
        </div>
      </div>
    </Card>
  );
}
