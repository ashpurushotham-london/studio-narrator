/** Game-mode definitions. Scoring and progression rules are plain data so they are easy to tune. */

export type ModeId = 'classic' | 'speed' | 'survival' | 'team' | 'daily';
export type AnswerKind = 'correct' | 'wrong' | 'skip';

export interface ScoringRules {
  /** Points awarded for each outcome. */
  points: Record<AnswerKind, number>;
  /** Lives lost for each outcome (only matters when the mode uses lives). */
  livesLost: Record<AnswerKind, number>;
  /** Seconds added (+) or removed (-) from the clock for each outcome (timed modes). */
  timeDelta: Record<AnswerKind, number>;
  /** Extra points each time the streak reaches a multiple of `streakBonusEvery` (0 = off). */
  streakBonusEvery: number;
  streakBonusPoints: number;
  /** Does a skip reset the current streak? */
  skipBreaksStreak: boolean;
}

export interface ModeConfig {
  id: ModeId;
  name: string;
  tagline: string;
  emoji: string;
  rules: ScoringRules;
  /** Uses a countdown clock. */
  timed: boolean;
  /** Uses lives. */
  lives: boolean;
  /** Played by taking turns. */
  turns: boolean;
}

const zero: Record<AnswerKind, number> = { correct: 0, wrong: 0, skip: 0 };

export const MODES: Record<ModeId, ModeConfig> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    tagline: 'No timer. Work through all 413 cards at your own pace.',
    emoji: '🃏',
    timed: false,
    lives: false,
    turns: false,
    rules: {
      points: { correct: 1, wrong: 0, skip: 0 },
      livesLost: zero,
      timeDelta: zero,
      streakBonusEvery: 0,
      streakBonusPoints: 0,
      skipBreaksStreak: false,
    },
  },
  speed: {
    id: 'speed',
    name: 'Speed',
    tagline: 'Beat the clock! Get as many right as you can.',
    emoji: '⚡',
    timed: true,
    lives: false,
    turns: false,
    rules: {
      points: { correct: 1, wrong: 0, skip: 0 },
      livesLost: zero,
      timeDelta: zero,
      streakBonusEvery: 0,
      streakBonusPoints: 0,
      skipBreaksStreak: false,
    },
  },
  survival: {
    id: 'survival',
    name: 'Survival',
    tagline: 'Every wrong answer costs a life. How long can you last?',
    emoji: '❤️',
    timed: false,
    lives: true,
    turns: false,
    rules: {
      points: { correct: 1, wrong: 0, skip: 0 },
      livesLost: { correct: 0, wrong: 1, skip: 0 },
      timeDelta: zero,
      streakBonusEvery: 5,
      streakBonusPoints: 2,
      skipBreaksStreak: true,
    },
  },
  team: {
    id: 'team',
    name: 'Team',
    tagline: 'Pass the phone! Up to four players take turns.',
    emoji: '👯',
    timed: false,
    lives: false,
    turns: true,
    rules: {
      points: { correct: 1, wrong: 0, skip: 0 },
      livesLost: zero,
      timeDelta: zero,
      streakBonusEvery: 0,
      streakBonusPoints: 0,
      skipBreaksStreak: false,
    },
  },
  daily: {
    id: 'daily',
    name: 'Daily Challenge',
    tagline: 'Twelve fresh cards, the same for everyone, once a day.',
    emoji: '📅',
    timed: false,
    lives: false,
    turns: false,
    rules: {
      points: { correct: 1, wrong: 0, skip: 0 },
      livesLost: zero,
      timeDelta: zero,
      streakBonusEvery: 0,
      streakBonusPoints: 0,
      skipBreaksStreak: false,
    },
  },
};

export const MODE_ORDER: ModeId[] = ['classic', 'speed', 'survival', 'team', 'daily'];
