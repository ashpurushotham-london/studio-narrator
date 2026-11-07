import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface TopBarProps {
  onExit: () => void;
  /** e.g. "12" */
  current: number;
  /** e.g. 413; omit for open-ended decks */
  total?: number;
  /** 0..1 */
  progress: number;
  /** Colour the bar red (timer warning). */
  warning?: boolean;
  right?: ReactNode;
  /** Right now the bar represents the clock instead of card progress. */
  barLabel?: string;
}

/** Card counter, animated progress bar and exit button. */
export function TopBar({ onExit, current, total, progress, warning, right, barLabel }: TopBarProps) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="flex items-center gap-3">
        <motion.button
          aria-label="Exit game"
          whileTap={{ scale: 0.88 }}
          onClick={onExit}
          className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-full border-[3px] border-white bg-white/15"
        >
          <ArrowLeft size={26} strokeWidth={3} />
        </motion.button>

        <div className="min-w-0 flex-1 text-center font-display leading-none" aria-live="polite">
          <span className="sr-only">Card </span>
          <motion.span key={current} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="inline-block text-4xl font-bold drop-shadow-[0_3px_0_#c90080] sm:text-5xl">
            {current}
          </motion.span>
          {total !== undefined && (
            <span className="text-2xl font-semibold text-white/80 sm:text-3xl">
              {' '}
              / {total}
            </span>
          )}
        </div>

        <div className="flex min-w-12 shrink-0 justify-end">{right}</div>
      </div>

      <div
        className="mt-2 h-4 overflow-hidden rounded-full border-[3px] border-white bg-black/30"
        role="progressbar"
        aria-label={barLabel ?? 'Progress'}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <motion.div
          className={`h-full rounded-full ${warning ? 'bg-wrong' : 'bg-white'}`}
          initial={false}
          animate={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
          transition={{ type: 'spring', stiffness: 160, damping: 22 }}
        />
      </div>
    </div>
  );
}
