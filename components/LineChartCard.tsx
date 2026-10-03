/**
 * LineChartCard — dark card with dual-line chart and toggle switches.
 * Used for "Compare Costs" style live transaction volume vs flagged volume.
 */
'use client';

import { Card } from './Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { useState } from 'react';
import type { TimeSeriesPoint } from '@/lib/types';

interface LineChartCardProps {
  title: string;
  data: TimeSeriesPoint[];
  line1Key: keyof TimeSeriesPoint;
  line1Label: string;
  line2Key: keyof TimeSeriesPoint;
  line2Label: string;
}

export function LineChartCard({ title, data, line1Key, line1Label, line2Key, line2Label }: LineChartCardProps) {
  const [show1, setShow1] = useState(true);
  const [show2, setShow2] = useState(true);

  return (
    <Card variant="dark" className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>

        {/* Toggle switches */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={show1}
              onChange={(e) => setShow1(e.target.checked)}
              className="w-4 h-4 rounded accent-teal-500"
            />
            <span className="text-xs text-white">{line1Label}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={show2}
              onChange={(e) => setShow2(e.target.checked)}
              className="w-4 h-4 rounded accent-teal-500"
            />
            <span className="text-xs text-white">{line2Label}</span>
          </label>
        </div>
      </div>

      <div className="flex-1 min-h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(27, 36, 71, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            {show1 && (
              <Line
                type="monotone"
                dataKey={line1Key}
                stroke="var(--color-teal-bright)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
                animationDuration={600}
              />
            )}
            {show2 && (
              <Line
                type="monotone"
                dataKey={line2Key}
                stroke="var(--color-periwinkle)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
                animationDuration={600}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
