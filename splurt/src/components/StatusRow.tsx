import { motion } from 'framer-motion';
import { Check, Flame, Heart, SkipForward, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Session } from '../logic/session';

function Chip({ children, tone = 'dark', label }: { children: ReactNode; tone?: 'dark' | 'light'; label?: string }) {
  return (
    <span
      aria-label={label}
      className={`inline-flex items-center gap-1.5 rounded-full border-[3px] border-white px-3 py-0.5 font-display text-xl font-bold ${tone === 'dark' ? 'bg-ink/70' : 'bg-white text-splurt'}`}
    >
      {children}
    </span>
  );
}

function Tally({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <Chip label={`${value} ${label}`}>
      {icon}
      <motion.span key={value} initial={{ scale: 1.6 }} animate={{ scale: 1 }} className="inline-block min-w-[1ch]">
        {value}
      </motion.span>
    </Chip>
  );
}

export function Lives({ lives, max }: { lives: number; max: number }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1" role="img" aria-label={`${lives} of ${max} lives left`}>
      {Array.from({ length: max }, (_, i) => {
        const alive = i < lives;
        return (
          <motion.span
            key={i}
            animate={alive ? { scale: 1 } : { scale: [1, 1.5, 0.8], rotate: [0, -15, 0] }}
            transition={{ duration: 0.4 }}
            className="inline-flex"
          >
            <Heart size={28} strokeWidth={3} className={alive ? 'fill-wrong text-white' : 'fill-black/40 text-white/40'} />
          </motion.span>
        );
      })}
    </div>
  );
}

/** Mode-specific scoreboard under the progress bar. */
export function StatusRow({ session }: { session: Session }) {
  const streak = session.streak >= 2 && (
    <Chip tone="light" label={`Streak ${session.streak}`}>
      <Flame size={20} strokeWidth={3} className="fill-orange-400 text-orange-500" />
      {session.streak}
    </Chip>
  );

  if (session.mode === 'survival') {
    return (
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <Lives lives={session.lives} max={session.maxLives} />
        <Chip label={`Score ${session.score}`}>Score {session.score}</Chip>
        {streak}
      </div>
    );
  }

  if (session.mode === 'speed') {
    return (
      <div className="mt-2 flex items-center justify-center gap-2">
        <Chip label={`Score ${session.score}`}>Score {session.score}</Chip>
        {streak}
      </div>
    );
  }

  if (session.mode === 'team') {
    return (
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2" aria-label="Scoreboard">
        {session.players.map((p, i) => (
          <motion.span
            key={i}
            animate={{ scale: i === session.turn ? 1.08 : 1, opacity: i === session.turn ? 1 : 0.7 }}
            className={`inline-flex items-center gap-2 rounded-full border-[3px] px-3 py-0.5 font-display text-lg font-bold ${i === session.turn ? 'border-white bg-white text-ink' : 'border-white/60 bg-ink/60'}`}
          >
            <span className="size-3.5 rounded-full border-2 border-ink" style={{ background: p.color }} />
            <span className="max-w-[7rem] truncate">{p.name}</span>
            <motion.span key={p.score} initial={{ scale: 1.7 }} animate={{ scale: 1 }}>
              {p.score}
            </motion.span>
          </motion.span>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center justify-center gap-2">
      <Tally icon={<Check size={20} strokeWidth={4} className="text-correct" />} value={session.correct} label="correct" />
      <Tally icon={<X size={20} strokeWidth={4} className="text-wrong" />} value={session.wrong} label="wrong" />
      <Tally icon={<SkipForward size={18} strokeWidth={3} />} value={session.skipped} label="skipped" />
      {streak}
    </div>
  );
}
