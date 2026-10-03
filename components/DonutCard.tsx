/**
 * DonutCard — donut chart with Recharts, used for budget/costs breakdowns.
 * Center shows a large bold number; legend shows category rows.
 */
'use client';

import { Card } from './Card';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface DonutDataPoint {
  name: string;
  value: number;
  color: string;
}

interface DonutCardProps {
  title: string;
  centerValue: string | number;
  centerLabel: string;
  data: DonutDataPoint[];
  variant?: 'default' | 'dark';
}

export function DonutCard({ title, centerValue, centerLabel, data, variant = 'default' }: DonutCardProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card variant={variant} className="flex flex-col">
      <h3 className="text-sm font-semibold mb-4" style={{ color: variant === 'dark' ? '#FFF' : 'var(--color-text-primary)' }}>
        {title}
      </h3>

      <div className="relative flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="65%"
              outerRadius="85%"
              paddingAngle={2}
              dataKey="value"
              isAnimationActive={true}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-center"
          >
            <p className="text-3xl font-bold" style={{ color: variant === 'dark' ? '#FFF' : 'var(--color-text-primary)' }}>
              {centerValue}
            </p>
            <p className="text-xs text-muted mt-0.5">{centerLabel}</p>
          </motion.div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2">
        {data.map((item, i) => {
          const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.3 }}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span style={{ color: variant === 'dark' ? 'rgba(255,255,255,0.9)' : 'var(--color-text-primary)' }}>
                  {item.name}
                </span>
              </div>
              <span className="font-semibold" style={{ color: variant === 'dark' ? '#FFF' : 'var(--color-text-primary)' }}>
                {percent}%
              </span>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
