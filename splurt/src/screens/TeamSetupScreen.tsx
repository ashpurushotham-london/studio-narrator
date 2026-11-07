import { AnimatePresence, motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { Segmented } from '../components/Toggle';
import { PLAYER_COLORS } from '../logic/session';
import { useApp } from '../state/AppContext';
import { LIMITS } from '../state/types';

export function TeamSetupScreen() {
  const { state, start, updateSettings } = useApp();
  const { lastPlayers, teamTurns } = state.settings;
  const [names, setNames] = useState<string[]>(() => (lastPlayers.length >= 2 ? lastPlayers.slice(0, 4) : ['Player 1', 'Player 2']));

  const set = (i: number, v: string) => setNames((n) => n.map((x, j) => (j === i ? v : x)));
  const cleaned = names.map((n, i) => n.trim() || `Player ${i + 1}`);
  const total = cleaned.length * teamTurns;

  return (
    <Screen title="Team mode" back="modes">
      <p className="mb-4 font-hand text-2xl text-white/90">Who's playing? Pass the phone round – everyone gets {teamTurns} turns.</p>

      <ul className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {names.map((name, i) => (
            <motion.li
              key={i}
              layout
              initial={{ opacity: 0, x: -30, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.8 }}
              className="flex items-center gap-3"
            >
              <span className="size-9 shrink-0 rounded-full border-[3px] border-white" style={{ background: PLAYER_COLORS[i] }} />
              <input
                aria-label={`Player ${i + 1} name`}
                value={name}
                maxLength={14}
                placeholder={`Player ${i + 1}`}
                onChange={(e) => set(i, e.target.value)}
                className="min-w-0 flex-1 rounded-2xl border-4 border-white bg-ink px-4 py-2.5 font-hand text-2xl text-white placeholder:text-white/40"
              />
              {names.length > LIMITS.minPlayers && (
                <button
                  aria-label={`Remove player ${i + 1}`}
                  onClick={() => setNames((n) => n.filter((_, j) => j !== i))}
                  className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border-[3px] border-white bg-white/15"
                >
                  <X strokeWidth={4} />
                </button>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {names.length < LIMITS.maxPlayers && (
        <Button className="mt-4" variant="ghost" icon={<Plus strokeWidth={4} />} onClick={() => setNames((n) => [...n, `Player ${n.length + 1}`])}>
          Add player
        </Button>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <span className="font-display text-2xl font-bold">Turns each</span>
        <Segmented options={LIMITS.teamTurns} value={teamTurns as (typeof LIMITS.teamTurns)[number]} label="Turns each" onChange={(v) => updateSettings({ teamTurns: v })} />
      </div>

      <Button size="lg" className="mt-8 w-full" onClick={() => start('team', cleaned)}>
        Start · {total} cards
      </Button>
    </Screen>
  );
}
