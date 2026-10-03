/**
 * ProgressBar — horizontal bar with percentage label.
 * Used in the goals/progress card.
 */
import { motion } from 'framer-motion';

interface ProgressBarProps {
  label: string;
  value: number;       // current value
  target?: number;     // target value (for percentage calculation)
  max?: number;        // max value for the bar (default 100)
  showPercent?: boolean;
  className?: string;
}

export function ProgressBar({
  label,
  value,
  target,
  max = 100,
  showPercent = true,
  className,
}: ProgressBarProps) {
  const percent = target ? Math.round((value / target) * 100) : value;
  const fillPercent = Math.min((percent / max) * 100, 100);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-body">{label}</span>
        {showPercent && (
          <span className="text-sm font-bold text-body">{percent}%</span>
        )}
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: 'rgba(27, 36, 71, 0.08)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${fillPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: 'var(--color-teal)' }}
        />
      </div>
    </div>
  );
}
