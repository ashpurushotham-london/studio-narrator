import { motion } from 'framer-motion';

const LETTERS = ['S', 'P', 'L', 'U', 'R', 'T'];
const TILTS = [-6, 4, -3, 6, -5, 3];
const LIFTS = [0, -0.05, 0.03, -0.04, 0.04, -0.02];

interface LogoProps {
  /** CSS font-size for the whole logo (letters are sized in em). */
  size?: string;
  animated?: boolean;
  className?: string;
}

/** The SPLURT wordmark: chunky white letters with a black outline, each tilted a little. */
export function Logo({ size = '4rem', animated = false, className = '' }: LogoProps) {
  return (
    <span
      role="img"
      aria-label="SPLURT"
      className={`inline-flex select-none items-end font-display font-bold leading-none ${className}`}
      style={{ fontSize: size }}
    >
      {LETTERS.map((l, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block text-white"
          style={{
            rotate: TILTS[i],
            marginTop: `${LIFTS[i]}em`,
            WebkitTextStroke: '0.14em #050505',
            paintOrder: 'stroke fill',
            filter: 'drop-shadow(0 0.07em 0 #c90080)',
            letterSpacing: '-0.02em',
          }}
          {...(animated
            ? {
                initial: { y: '-1.2em', opacity: 0, scale: 0.5 },
                animate: { y: 0, opacity: 1, scale: 1 },
                transition: { type: 'spring', stiffness: 380, damping: 14, delay: 0.08 * i },
                whileHover: { y: '-0.1em', rotate: TILTS[i] * -1 },
              }
            : {})}
        >
          {l}
        </motion.span>
      ))}
    </span>
  );
}
