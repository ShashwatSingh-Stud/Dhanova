/**
 * RadarCard — radar/spider chart showing SHAP feature contributions.
 * Teal fill with navy axes.
 */
'use client';

import { Card } from './Card';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface RadarDataPoint {
  feature: string;
  value: number;     // normalized 0-100
  fullMark: number;  // always 100
}

interface RadarCardProps {
  title: string;
  data: RadarDataPoint[];
}

export function RadarCard({ title, data }: RadarCardProps) {
  return (
    <Card className="flex flex-col">
      <h3 className="text-sm font-semibold text-body mb-4">{title}</h3>

      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="rgba(27,36,71,0.12)" />
            <PolarAngleAxis
              dataKey="feature"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
            />
            <Radar
              name="Features"
              dataKey="value"
              stroke="var(--color-teal)"
              fill="var(--color-teal)"
              fillOpacity={0.25}
              isAnimationActive={true}
              animationDuration={800}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
