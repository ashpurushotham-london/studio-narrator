import { AnimatePresence, motion, type Variants } from 'framer-motion';
import type { AnswerKind } from '../logic/modes';
import type { ResolvedChallenge } from '../logic/engine';
import { BlackCard, PinkCard } from './Cards';

type Custom = AnswerKind | undefined;

/** Pink card: slides in from the left; leaves according to how the player answered. */
const pinkVariants: Variants = {
  enter: { x: '-60%', y: 30, rotate: -9, opacity: 0, scale: 0.9 },
  center: { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 22 } },
  exit: (r: Custom) =>
    r === 'correct'
      ? { y: '-70%', rotate: -6, opacity: 0, scale: 1.04, transition: { duration: 0.32, ease: 'easeIn' } }
      : r === 'wrong'
        ? { y: '70%', rotate: 8, opacity: 0, transition: { duration: 0.34, ease: 'easeIn' } }
        : { x: '-70%', rotate: -12, opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } },
};

/** Black card: flips in (like turning a card over). */
const blackVariants: Variants = {
  enter: { rotateY: 100, x: '40%', opacity: 0, scale: 0.92 },
  center: { rotateY: 0, x: 0, opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20, delay: 0.07 } },
  exit: (r: Custom) =>
    r === 'correct'
      ? { y: '-70%', rotate: 6, opacity: 0, scale: 1.04, transition: { duration: 0.32, ease: 'easeIn' } }
      : r === 'wrong'
        ? { y: '70%', rotate: -8, opacity: 0, transition: { duration: 0.34, ease: 'easeIn' } }
        : { x: '70%', rotate: 12, opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } },
};

interface CardPairProps {
  challenge: ResolvedChallenge | null;
  /** Unique per card, so the pair animates on every change. */
  cardKey: string | number;
  lastResult?: AnswerKind;
}

/** Two big side-by-side (landscape) or stacked (portrait) cards that fill the available space. */
export function CardPair({ challenge, cardKey, lastResult }: CardPairProps) {
  return (
    <div className="absolute inset-0" style={{ perspective: 1400 }}>
      <AnimatePresence custom={lastResult}>
        {challenge && (
          <motion.div
            key={cardKey}
            custom={lastResult}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 grid gap-3 px-1 pb-3 portrait:grid-rows-2 landscape:grid-cols-2 landscape:gap-5"
          >
            <motion.div custom={lastResult} variants={pinkVariants} className="min-h-0 min-w-0">
              <PinkCard text={challenge.question.text} />
            </motion.div>
            <motion.div custom={lastResult} variants={blackVariants} className="min-h-0 min-w-0">
              <BlackCard label={challenge.restriction.label} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
