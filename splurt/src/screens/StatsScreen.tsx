import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Screen } from '../components/Screen';
import { useApp } from '../state/AppContext';

function Tile({ label, value, small }: { label: string; value: ReactNode; small?: boolean }) {
  return (
    <div className="sticker px-3 py-3 text-center">
      <div className={`font-display font-bold leading-none text-splurt ${small ? 'text-3xl' : 'text-4xl'}`}>{value}</div>
      <div className="mt-1 font-hand text-xl leading-tight">{label}</div>
    </div>
  );
}

function Section({ title, children, i }: { title: string; children: ReactNode; i: number }) {
  return (
    <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }} className="mb-5">
      <h2 className="mb-2 font-display text-2xl font-bold drop-shadow-[0_2px_0_#c90080]">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{children}</div>
    </motion.section>
  );
}

export function StatsScreen() {
  const { state } = useApp();
  const { stats } = state;
  const classic = stats.byMode.classic;
  const classicAcc = classic.correct + classic.wrong ? Math.round((classic.correct / (classic.correct + classic.wrong)) * 100) : null;

  return (
    <Screen title="Stats" back="menu">
      <Section title="Overall" i={0}>
        <Tile label="Games played" value={stats.gamesPlayed} />
        <Tile label="Challenges completed" value={stats.challengesCompleted} />
        <Tile label="Correct" value={stats.correct} />
        <Tile label="Incorrect" value={stats.wrong} />
        <Tile label="Skipped" value={stats.skipped} />
        <Tile label="Current streak 🔥" value={stats.currentStreak} />
        <Tile label="Best streak" value={stats.bestStreak} />
      </Section>

      <Section title="🃏 Classic" i={1}>
        <Tile label="Cards correct" value={classic.correct} />
        <Tile label="Cards wrong" value={classic.wrong} />
        <Tile label="Cards skipped" value={classic.skipped} />
        <Tile label="Accuracy" value={classicAcc === null ? '–' : `${classicAcc}%`} />
        <Tile label="Boxes finished" value={stats.classic.boxesCompleted} />
        <Tile label="Games started" value={classic.games} />
      </Section>

    </Screen>
  );
}
