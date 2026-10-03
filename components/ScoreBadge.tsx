import { getRiskBand } from '@/lib/types';
import { clsx } from 'clsx';

interface ScoreBadgeProps {
  score: number;
  className?: string;
}

/**
 * Filled badge showing a risk score with label.
 * Colour encodes severity; text label ensures accessibility.
 * Text is always white or navy — never teal on light surfaces.
 */
export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  const band = getRiskBand(score);

  const bg = {
    high: 'var(--color-risk-high)',
    mid:  'var(--color-risk-mid)',
    low:  'var(--color-risk-low)',
  }[band];

  // White text on red/teal, navy on amber for contrast
  const textColor = band === 'mid' ? 'var(--color-navy-dark)' : '#FFFFFF';

  const label = { high: 'High', mid: 'Medium', low: 'Low' }[band];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold leading-snug',
        className,
      )}
      style={{ backgroundColor: bg, color: textColor }}
      role="status"
      aria-label={`Risk score ${score}, ${label}`}
    >
      {score}
      <span className="font-medium">{label}</span>
    </span>
  );
}
