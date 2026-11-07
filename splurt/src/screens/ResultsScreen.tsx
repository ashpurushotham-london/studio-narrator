import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { Crown, Flame, Trophy } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { Button } from '../components/Button';
import { dateKey } from '../logic/engine';
import { MODES } from '../logic/modes';
import { accuracy, winners, type Session } from '../logic/session';
import { dailyStreak } from '../logic/stats';
import { useApp } from '../state/AppContext';

function Stat({ label, value, delay }: { label: string; value: ReactNode; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 380, damping: 18 }}
      className="sticker px-2 py-3 text-center"
    >
      <div className="font-display text-4xl font-bold text-splurt">{value}</div>
      <div className="font-hand text-xl">{label}</div>
    </motion.div>
  );
}

function headline(s: Session): { title: string; sub: string } {
  switch (s.mode) {
    case 'speed':
      return { title: s.endReason === 'time' ? "Time's up!" : 'Round over', sub: `${s.correct} correct in ${s.duration} seconds` };
    case 'survival':
      return { title: s.endReason === 'lives' ? 'Out of lives!' : 'Game over', sub: `You survived ${s.index} cards` };
    case 'daily':
      return { title: s.endReason === 'deck' ? 'Daily complete!' : 'Daily ended early', sub: s.dailyKey ?? '' };
    case 'team':
      return { title: 'Final scores', sub: `${s.players.length} players · ${s.deck.length} cards` };
    default:
      return { title: s.endReason === 'deck' ? 'You finished the box!' : 'Game over', sub: `${s.index} of ${s.deck.length} cards played` };
  }
}

export function ResultsScreen() {
  const { state, start, leaveResults } = useApp();
  const s = state.session;
  const win = !!s && (s.newBest || s.mode === 'team' || (s.mode === 'daily' && s.endReason === 'deck') || s.endReason === 'deck');

  useEffect(() => {
    if (!win) return;
    const t = window.setTimeout(() => confetti({ particleCount: 140, spread: 100, origin: { y: 0.35 }, colors: ['#ffffff', '#f000a0', '#ffd400', '#19d98b', '#3cc8ff'] }), 250);
    return () => window.clearTimeout(t);
  }, [win]);

  if (!s) return null;
  const { title, sub } = headline(s);
  const acc = accuracy(s);
  const top = winners(s);
  const ranked = [...s.players].sort((a, b) => b.score - a.score);
  const players = s.players.map((p) => p.name);

  const again = () => {
    if (s.mode === 'daily') return leaveResults('menu');
    const mode = s.mode;
    start(mode, mode === 'team' ? players : undefined);
  };

  return (
    <motion.main
      className="splurt-bg pt-safe pb-safe flex h-dvh flex-col items-center overflow-y-auto px-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="my-auto flex w-full max-w-lg flex-col items-center gap-5 py-6 text-center">
        <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }}>
          {s.mode === 'team' ? <Crown size={80} strokeWidth={2.5} className="fill-[#ffd400]" /> : <Trophy size={80} strokeWidth={2.5} className="fill-[#ffd400]" />}
        </motion.div>

        <div>
          <h1 className="font-display text-5xl font-bold drop-shadow-[0_4px_0_#c90080] sm:text-6xl">{title}</h1>
          <p className="mt-1 font-hand text-2xl text-white/90">{sub}</p>
        </div>

        {s.newBest && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [-4, 4, -4] }}
            transition={{ scale: { type: 'spring', delay: 0.3 }, rotate: { repeat: Infinity, duration: 1.2 } }}
            className="rounded-full border-4 border-white bg-[#ffd400] px-5 py-1 font-display text-2xl font-bold text-ink"
          >
            ⭐ New personal best!
          </motion.div>
        )}

        {s.mode === 'team' ? (
          <div className="w-full">
            <p className="mb-3 font-display text-3xl font-bold">
              {top.length > 1 ? `It's a tie: ${top.map((p) => p.name).join(' & ')}!` : `${top[0]?.name} wins! 🎉`}
            </p>
            <ol className="flex flex-col gap-2">
              {ranked.map((p, i) => (
                <motion.li
                  key={p.name + i}
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 * i }}
                  className="sticker flex items-center gap-3 px-4 py-2"
                >
                  <span className="font-display text-2xl font-bold">{i + 1}</span>
                  <span className="size-6 rounded-full border-[3px] border-ink" style={{ background: p.color }} />
                  <span className="flex-1 truncate text-left font-display text-2xl font-bold">{p.name}</span>
                  <span className="font-hand text-lg text-ink/60">
                    {p.correct}✓ {p.wrong}✗
                  </span>
                  <span className="font-display text-3xl font-bold text-splurt">{p.score}</span>
                </motion.li>
              ))}
            </ol>
          </div>
        ) : (
          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Score" value={s.score} delay={0.1} />
            <Stat label="Correct" value={s.correct} delay={0.2} />
            <Stat label="Wrong" value={s.wrong} delay={0.3} />
            <Stat label="Skipped" value={s.skipped} delay={0.4} />
            <Stat label="Best streak" value={<span className="inline-flex items-center gap-1"><Flame className="fill-orange-400 text-orange-500" size={28} />{s.bestStreak}</span>} delay={0.5} />
            <Stat label="Accuracy" value={acc === null ? '–' : `${acc}%`} delay={0.6} />
          </div>
        )}

        {s.mode === 'daily' && s.endReason === 'deck' && (
          <p className="font-hand text-2xl">🔥 {dailyStreak(state.stats, dateKey())} day streak. See you tomorrow!</p>
        )}

        <div className="mt-2 flex w-full flex-col gap-3">
          {s.mode !== 'daily' && (
            <Button size="lg" onClick={again}>
              Play {MODES[s.mode].name} again
            </Button>
          )}
          <Button variant="dark" size="lg" onClick={() => leaveResults('menu')}>
            Main menu
          </Button>
        </div>
      </div>
    </motion.main>
  );
}
