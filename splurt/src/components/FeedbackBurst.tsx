import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { AnswerKind } from '../logic/modes';

const PHRASES: Record<AnswerKind, string[]> = {
  correct: ['Nice!', 'Splurt!', 'Yes!', 'Boom!', 'Smart!', 'Ooh yes!', 'Got it!'],
  wrong: ['Oops!', 'Nope!', 'So close!', 'Argh!', 'Next!'],
  skip: ['Skipped', 'Pass!', 'Moving on'],
};
const STYLE: Record<AnswerKind, string> = {
  correct: 'bg-correct text-ink',
  wrong: 'bg-wrong text-white',
  skip: 'bg-white text-ink',
};

interface Burst {
  id: number;
  kind: AnswerKind;
  text: string;
  bonus: boolean;
}

/** A pop-up sticker in the middle of the table after each answer. `count` changes on every answer. */
export function FeedbackBurst({ count, kind, bonus }: { count: number; kind?: AnswerKind; bonus?: boolean }) {
  const [burst, setBurst] = useState<Burst | null>(null);

  useEffect(() => {
    if (!kind || count === 0) return;
    const list = PHRASES[kind];
    setBurst({ id: count, kind, text: list[count % list.length], bonus: !!bonus });
    const t = window.setTimeout(() => setBurst(null), 650);
    return () => window.clearTimeout(t);
  }, [count, kind, bonus]);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center" aria-hidden>
      <AnimatePresence>
        {burst && (
          <motion.div
            key={burst.id}
            initial={{ scale: 0.2, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: burst.kind === 'wrong' ? 5 : -5, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0, y: -40 }}
            transition={{ type: 'spring', stiffness: 520, damping: 16 }}
            className={`rounded-full border-[5px] border-white px-7 py-3 text-center font-display text-4xl font-bold shadow-[0_8px_0_rgba(0,0,0,0.3)] sm:text-6xl ${STYLE[burst.kind]}`}
          >
            {burst.text}
            {burst.bonus && <div className="text-xl sm:text-2xl">🔥 streak bonus!</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
