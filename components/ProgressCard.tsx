/**
 * ProgressCard — multiple progress bars in rows (like "Goals" card in reference).
 * Shows: Recall vs target, Active holds, Rings detected, Avg review time.
 */
'use client';

import { Card } from './Card';
import { ProgressBar } from './ProgressBar';
import { motion } from 'framer-motion';

interface ProgressItem {
  label: string;
  value: number;
  target?: number;
  max?: number;
}

interface ProgressCardProps {
  title: string;
  items: ProgressItem[];
}

export function ProgressCard({ title, items }: ProgressCardProps) {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-body mb-4">{title}</h3>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
        className="space-y-4"
      >
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0 },
            }}
          >
            <ProgressBar
              label={item.label}
              value={item.value}
              target={item.target}
              max={item.max}
            />
          </motion.div>
        ))}
      </motion.div>
    </Card>
  );
}
