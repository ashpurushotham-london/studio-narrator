import type { AnswerKind, ModeId } from './modes';
import type { Session } from './session';

export interface ModeTally {
  games: number;
  correct: number;
  wrong: number;
  skipped: number;
}

export interface DailyResult {
  date: string;
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
  score: number;
}

export interface Stats {
  gamesPlayed: number;
  correct: number;
  wrong: number;
  skipped: number;
  currentStreak: number;
  bestStreak: number;
  /** Every card the player has answered or skipped. */
  challengesCompleted: number;
  byMode: Record<ModeId, ModeTally>;
  classic: { boxesCompleted: number; bestScore: number };
  speed: { best: number };
  survival: { bestScore: number; bestStreak: number };
  daily: { results: Record<string, DailyResult> };
}

const tally = (): ModeTally => ({ games: 0, correct: 0, wrong: 0, skipped: 0 });

export function emptyStats(): Stats {
  return {
    gamesPlayed: 0,
    correct: 0,
    wrong: 0,
    skipped: 0,
    currentStreak: 0,
    bestStreak: 0,
    challengesCompleted: 0,
    byMode: { classic: tally(), speed: tally(), survival: tally(), team: tally(), daily: tally() },
    classic: { boxesCompleted: 0, bestScore: 0 },
    speed: { best: 0 },
    survival: { bestScore: 0, bestStreak: 0 },
    daily: { results: {} },
  };
}

/** Record one answer. `firstOfGame` counts the game as played. */
export function recordAnswer(stats: Stats, mode: ModeId, kind: AnswerKind, firstOfGame: boolean): Stats {
  const currentStreak = kind === 'correct' ? stats.currentStreak + 1 : kind === 'wrong' ? 0 : stats.currentStreak;
  const m = stats.byMode[mode];
  return {
    ...stats,
    gamesPlayed: stats.gamesPlayed + (firstOfGame ? 1 : 0),
    correct: stats.correct + (kind === 'correct' ? 1 : 0),
    wrong: stats.wrong + (kind === 'wrong' ? 1 : 0),
    skipped: stats.skipped + (kind === 'skip' ? 1 : 0),
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
    challengesCompleted: stats.challengesCompleted + 1,
    byMode: {
      ...stats.byMode,
      [mode]: {
        games: m.games + (firstOfGame ? 1 : 0),
        correct: m.correct + (kind === 'correct' ? 1 : 0),
        wrong: m.wrong + (kind === 'wrong' ? 1 : 0),
        skipped: m.skipped + (kind === 'skip' ? 1 : 0),
      },
    },
  };
}

/** Record end-of-game results (personal bests, daily completion). */
export function recordFinish(stats: Stats, s: Session): { stats: Stats; newBest: boolean } {
  let newBest = false;
  const next: Stats = { ...stats };

  if (s.mode === 'classic') {
    next.classic = {
      boxesCompleted: stats.classic.boxesCompleted + (s.endReason === 'deck' ? 1 : 0),
      bestScore: Math.max(stats.classic.bestScore, s.score),
    };
    newBest = s.score > stats.classic.bestScore && stats.classic.bestScore > 0;
  } else if (s.mode === 'speed') {
    newBest = s.score > stats.speed.best;
    next.speed = { best: Math.max(stats.speed.best, s.score) };
  } else if (s.mode === 'survival') {
    newBest = s.score > stats.survival.bestScore || s.bestStreak > stats.survival.bestStreak;
    next.survival = {
      bestScore: Math.max(stats.survival.bestScore, s.score),
      bestStreak: Math.max(stats.survival.bestStreak, s.bestStreak),
    };
  } else if (s.mode === 'daily' && s.dailyKey && s.endReason === 'deck') {
    next.daily = {
      results: {
        ...stats.daily.results,
        [s.dailyKey]: {
          date: s.dailyKey,
          correct: s.correct,
          wrong: s.wrong,
          skipped: s.skipped,
          total: s.deck.length,
          score: s.score,
        },
      },
    };
  }
  // A brand-new best of 0 isn't worth celebrating.
  if (s.score === 0 && s.mode !== 'survival') newBest = false;
  return { stats: next, newBest };
}

/** Consecutive days (ending today or yesterday) with a completed daily challenge. */
export function dailyStreak(stats: Stats, today: string): number {
  const done = stats.daily.results;
  const cursor = new Date(`${today}T12:00:00`);
  const key = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  if (!done[key(cursor)]) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (done[key(cursor)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
