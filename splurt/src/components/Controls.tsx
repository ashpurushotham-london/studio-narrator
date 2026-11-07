import { motion } from 'framer-motion';
import { Check, SkipForward, X } from 'lucide-react';
import type { AnswerKind } from '../logic/modes';

interface ControlsProps {
  onAnswer: (kind: AnswerKind) => void;
  disabled?: boolean;
}

const BUTTONS: { kind: AnswerKind; label: string; hint: string; icon: typeof Check; cls: string }[] = [
  { kind: 'wrong', label: 'Wrong', hint: 'W', icon: X, cls: 'bg-wrong text-white [--btn-shadow:#a31c2c]' },
  { kind: 'skip', label: 'Skip', hint: 'S', icon: SkipForward, cls: 'bg-white text-ink [--btn-shadow:#c9c9c9]' },
  { kind: 'correct', label: 'Correct', hint: 'C', icon: Check, cls: 'bg-correct text-ink [--btn-shadow:#0c8a57]' },
];

/** The three answer buttons. Keyboard: W / S / C, or ← ↓ →. */
export function Controls({ onAnswer, disabled }: ControlsProps) {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-3xl items-stretch gap-2.5 pt-2 sm:gap-4" role="group" aria-label="Answer controls">
      {BUTTONS.map(({ kind, label, hint, icon: Icon, cls }) => (
        <motion.button
          key={kind}
          type="button"
          disabled={disabled}
          aria-label={`${label} (${hint})`}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.93 }}
          transition={{ type: 'spring', stiffness: 520, damping: 20 }}
          onClick={() => onAnswer(kind)}
          className={`btn-chunky flex min-h-[4.25rem] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-3xl border-4 border-white font-display font-bold sm:min-h-20 sm:flex-row sm:gap-3 sm:text-2xl ${kind === 'skip' ? 'flex-[0.8]' : 'flex-1'} ${cls}`}
        >
          <Icon strokeWidth={4} className="size-7 sm:size-8" />
          <span className="text-lg leading-none sm:text-2xl">{label}</span>
        </motion.button>
      ))}
    </div>
  );
}
