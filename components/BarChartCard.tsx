/**
 * BarChartCard — bar chart with segmented tabs and time axis.
 * Highlighted bars are teal with value labels above.
 */
'use client';

import { Card } from './Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { clsx } from 'clsx';
import type { TimeSeriesPoint } from '@/lib/types';

interface BarChartCardProps {
  title: string;
  tabs: string[];
  data: TimeSeriesPoint[];
}

export function BarChartCard({ title, tabs, data }: BarChartCardProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  // Map tab to data key
  const dataKey = activeTab.toLowerCase() as keyof TimeSeriesPoint;

  // Pick a few bars to highlight (e.g., index 1 and 4)
  const highlightIndices = [1, 4];

  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-body">{title}</h3>

        {/* Segmented tabs */}
        <div className="flex items-center gap-1 rounded-full px-1 py-1" style={{ backgroundColor: 'rgba(27,36,71,0.06)' }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                activeTab === tab
                  ? 'text-white font-semibold'
                  : 'text-muted hover:text-body',
              )}
              style={activeTab === tab ? { backgroundColor: 'var(--color-teal)' } : {}}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,36,71,0.08)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(27,36,71,0.1)' }}
            />
            <YAxis
              tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Bar
              dataKey={dataKey}
              radius={[10, 10, 0, 0]}
              isAnimationActive={true}
              animationDuration={600}
            >
              {data.map((entry, index) => {
                const isHighlighted = highlightIndices.includes(index);
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={isHighlighted ? 'var(--color-teal)' : 'var(--color-navy-mid)'}
                  />
                );
              })}
              {/* Show value labels on highlighted bars */}
              <LabelList
                dataKey={dataKey}
                position="top"
                content={(props: any) => {
                  const { x, y, width, value, index } = props;
                  if (!highlightIndices.includes(index)) return null;
                  return (
                    <text
                      x={x + width / 2}
                      y={y - 5}
                      fill="var(--color-text-body)"
                      fontSize={11}
                      fontWeight={600}
                      textAnchor="middle"
                    >
                      {value}
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
