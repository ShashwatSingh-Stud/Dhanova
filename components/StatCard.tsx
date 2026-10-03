/**
 * StatCard — used in hero card and progress/goals card.
 * Displays a large number with a label and optional subtitle.
 */
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  subtitle?: string;
  format?: 'number' | 'currency' | 'percent';
  className?: string;
}

/**
 * Animated count-up hook using Framer Motion
 */
function useCountUp(target: number, duration = 1000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16); // ~60fps
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
}

export function StatCard({ label, value, subtitle, format = 'number', className }: StatCardProps) {
  const numValue = typeof value === 'number' ? value : 0;
  const animatedValue = useCountUp(numValue, 1200);

  const formatted = format === 'currency'
    ? `₹${animatedValue.toLocaleString('en-IN')}`
    : format === 'percent'
    ? `${animatedValue}%`
    : typeof value === 'string'
    ? value
    : animatedValue.toLocaleString('en-IN');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted mb-1">
        {label}
      </p>
      <p className="text-3xl font-bold text-body mb-0.5">
        {formatted}
      </p>
      {subtitle && (
        <p className="text-sm text-muted">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
