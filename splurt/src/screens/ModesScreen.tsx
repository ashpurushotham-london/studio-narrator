import { motion } from 'framer-motion';
import { Flame, Lock } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Screen } from '../components/Screen';
import { dateKey } from '../logic/engine';
import { MODE_ORDER, MODES, type ModeId } from '../logic/modes';
import { dailyStreak } from '../logic/stats';
import { useApp } from '../state/AppContext';

const TILE_COLORS: Record<ModeId, string> = {
  classic: 'bg-white text-ink',
  speed: 'bg-[#ffd400] text-ink',
  survival: 'bg-[#ff4d5e] text-white',
  team: 'bg-[#3cc8ff] text-ink',
  daily: 'bg-ink text-white',
};

export function ModesScreen() {
  const { state, start, go } = useApp();
  const { stats, settings, session } = state;
  const today = dateKey();
  const todayResult = stats.daily.results[today];
  const [pending, setPending] = useState<ModeId | null>(null);
  const [dailyInfo, setDailyInfo] = useState(false);
  const saved = session && session.status === 'playing' ? session : null;

  const detail = (id: ModeId): string => {
    switch (id) {
      case 'classic':
        return `Boxes finished: ${stats.classic.boxesCompleted}`;
      case 'speed':
        return `${settings.speedSeconds} seconds · Best: ${stats.speed.best}`;
      case 'survival':
        return `${settings.lives} ${settings.lives === 1 ? 'life' : 'lives'} · Best: ${stats.survival.bestScore}`;
      case 'team':
        return `2–4 players · ${settings.teamTurns} turns each`;
      case 'daily':
        return todayResult ? `✓ Done today: ${todayResult.correct}/${todayResult.total}` : `${dailyStreak(stats, today)} day streak`;
    }
  };

  const launch = (id: ModeId) => {
    if (id === 'daily' && todayResult) return setDailyInfo(true);
    if (id === 'team') {
      // Team games begin on the player set-up screen.
      return saved ? setPending(id) : go('teamSetup');
    }
    if (saved && !(saved.mode === id && id === 'daily')) return setPending(id);
    start(id);
  };

  const confirmReplace = () => {
    const id = pending!;
    setPending(null);
    if (id === 'team') go('teamSetup');
    else start(id);
  };

  return (
    <Screen title="Pick a mode" back="menu">
      <ul className="flex flex-col gap-4 pb-4">
        {MODE_ORDER.map((id, i) => {
          const m = MODES[id];
          const done = id === 'daily' && !!todayResult;
          return (
            <motion.li
              key={id}
              initial={{ opacity: 0, y: 30, rotate: i % 2 ? 2 : -2 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: 0.06 * i, type: 'spring', stiffness: 300, damping: 22 }}
            >
              <motion.button
                whileHover={{ scale: 1.02, rotate: i % 2 ? 0.6 : -0.6 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => launch(id)}
                className={`btn-chunky flex w-full cursor-pointer items-center gap-4 rounded-[1.75rem] border-4 border-white p-4 text-left ${TILE_COLORS[id]}`}
                style={{ ['--btn-shadow' as string]: '#c90080' }}
              >
                <span className="text-5xl" aria-hidden>
                  {m.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-3xl font-bold leading-tight">{m.name}</span>
                  <span className="block font-hand text-xl leading-snug opacity-90">{m.tagline}</span>
                  <span className="mt-1 inline-block rounded-full bg-black/20 px-3 py-0.5 font-display text-base font-semibold">
                    {detail(id)}
                  </span>
                </span>
                {done && <Lock aria-label="Completed today" />}
                {saved?.mode === id && !done && (
                  <span className="rounded-full bg-black/25 px-2 py-1 font-display text-sm font-bold">saved game</span>
                )}
              </motion.button>
            </motion.li>
          );
        })}
      </ul>

      <Modal open={pending !== null} title="Start a new game?" onClose={() => setPending(null)}>
        <p className="mb-5 font-hand text-2xl text-white/85">
          You have an unfinished {saved ? MODES[saved.mode].name : ''} game. Starting a new one will replace it.
        </p>
        <div className="flex flex-col gap-3">
          <Button variant="white" onClick={confirmReplace}>
            Start new game
          </Button>
          <Button variant="ghost" onClick={() => setPending(null)}>
            Cancel
          </Button>
        </div>
      </Modal>

      <Modal open={dailyInfo} title="All done for today!" onClose={() => setDailyInfo(false)}>
        {todayResult && (
          <>
            <p className="font-display text-6xl font-bold text-splurt">
              {todayResult.correct}/{todayResult.total}
            </p>
            <p className="mb-1 mt-2 font-hand text-2xl text-white/85">
              {todayResult.wrong} wrong · {todayResult.skipped} skipped
            </p>
            <p className="mb-5 flex items-center justify-center gap-2 font-hand text-2xl text-white/85">
              <Flame className="fill-orange-400 text-orange-500" /> {dailyStreak(stats, today)} day streak. Come back tomorrow for a new set!
            </p>
          </>
        )}
        <Button variant="white" onClick={() => setDailyInfo(false)}>
          Nice
        </Button>
      </Modal>
    </Screen>
  );
}
