import { CLASSIC_CARD_COUNT, dailyDeck, dateKey, generateDeck, resolve, type Challenge } from './engine';
import { MODES, type AnswerKind, type ModeId } from './modes';
import { randomSeed } from './rng';
import { scoreAnswer } from './scoring';
import type { Settings } from '../state/types';

export const PLAYER_COLORS = ['#FFD400', '#19D98B', '#3CC8FF', '#FF8A3D'] as const;
export const SPEED_DECK_SIZE = 150;

export interface Player {
  name: string;
  color: string;
  score: number;
  correct: number;
  wrong: number;
  skipped: number;
}

export type EndReason = 'deck' | 'time' | 'lives' | 'quit';

export interface Session {
  id: string;
  mode: ModeId;
  seed: string;
  deck: Challenge[];
  /** Index of the card currently showing (== deck.length once the deck is used up). */
  index: number;
  results: AnswerKind[];
  score: number;
  streak: number;
  bestStreak: number;
  correct: number;
  wrong: number;
  skipped: number;
  lives: number;
  maxLives: number;
  timeLeft: number;
  duration: number;
  players: Player[];
  /** Whose turn it is (Team mode). */
  turn: number;
  status: 'playing' | 'finished';
  endReason?: EndReason;
  /** Set when the finished game beat a personal best. */
  newBest?: boolean;
  dailyKey?: string;
  startedAt: number;
  /** Outcome of the last answer – drives card exit animations. */
  lastResult?: AnswerKind;
  /** Whether the last correct answer earned a streak bonus. */
  lastBonus?: boolean;
}

export interface NewSessionParams {
  mode: ModeId;
  settings: Settings;
  players?: string[];
  /** How many Classic boxes the player has finished – picks the (fixed) deck. */
  classicRun?: number;
  now?: number;
  seed?: string;
  dailyKey?: string;
}

export function createSession(p: NewSessionParams): Session {
  const now = p.now ?? Date.now();
  const names = (p.players ?? []).map((n) => n.trim()).filter(Boolean);
  let deck: Challenge[];
  let seed: string;
  let dailyKeyValue: string | undefined;

  switch (p.mode) {
    case 'classic':
      seed = p.seed ?? `splurt-classic-${p.classicRun ?? 0}`;
      deck = generateDeck(CLASSIC_CARD_COUNT, seed);
      break;
    case 'speed':
      seed = p.seed ?? randomSeed();
      deck = generateDeck(SPEED_DECK_SIZE, seed);
      break;
    case 'survival':
      seed = p.seed ?? randomSeed();
      deck = generateDeck(CLASSIC_CARD_COUNT, seed);
      break;
    case 'team':
      seed = p.seed ?? randomSeed();
      deck = generateDeck(Math.max(2, names.length) * p.settings.teamTurns, seed);
      break;
    case 'daily':
      dailyKeyValue = p.dailyKey ?? dateKey(new Date(now));
      seed = `splurt-daily-${dailyKeyValue}`;
      deck = dailyDeck(dailyKeyValue);
      break;
  }

  const players: Player[] =
    p.mode === 'team'
      ? names.slice(0, 4).map((name, i) => ({
          name,
          color: PLAYER_COLORS[i],
          score: 0,
          correct: 0,
          wrong: 0,
          skipped: 0,
        }))
      : [];

  const duration = MODES[p.mode].timed ? p.settings.speedSeconds : 0;
  return {
    id: `${p.mode}-${now.toString(36)}`,
    mode: p.mode,
    seed,
    deck,
    index: 0,
    results: [],
    score: 0,
    streak: 0,
    bestStreak: 0,
    correct: 0,
    wrong: 0,
    skipped: 0,
    lives: MODES[p.mode].lives ? p.settings.lives : 0,
    maxLives: MODES[p.mode].lives ? p.settings.lives : 0,
    timeLeft: duration,
    duration,
    players,
    turn: 0,
    status: 'playing',
    dailyKey: dailyKeyValue,
    startedAt: now,
  };
}

/** Apply one answer. Pure: returns a new session. */
export function answerSession(s: Session, kind: AnswerKind): Session {
  if (s.status !== 'playing' || s.index >= s.deck.length) return s;
  const rules = MODES[s.mode].rules;
  const outcome = scoreAnswer(rules, kind, s.streak);

  const next: Session = {
    ...s,
    results: [...s.results, kind],
    score: s.score + outcome.points,
    streak: outcome.streak,
    bestStreak: Math.max(s.bestStreak, outcome.streak),
    correct: s.correct + (kind === 'correct' ? 1 : 0),
    wrong: s.wrong + (kind === 'wrong' ? 1 : 0),
    skipped: s.skipped + (kind === 'skip' ? 1 : 0),
    lives: Math.max(0, s.lives - outcome.livesLost),
    timeLeft: s.duration ? Math.max(0, s.timeLeft + outcome.timeDelta) : s.timeLeft,
    index: s.index + 1,
    lastResult: kind,
    lastBonus: outcome.bonus,
  };

  if (MODES[s.mode].turns && s.players.length) {
    next.players = s.players.map((pl, i) =>
      i === s.turn
        ? {
            ...pl,
            score: pl.score + outcome.points,
            correct: pl.correct + (kind === 'correct' ? 1 : 0),
            wrong: pl.wrong + (kind === 'wrong' ? 1 : 0),
            skipped: pl.skipped + (kind === 'skip' ? 1 : 0),
          }
        : pl,
    );
    next.turn = (s.turn + 1) % s.players.length;
  }

  if (MODES[s.mode].lives && next.lives <= 0) return finish(next, 'lives');
  if (next.duration && next.timeLeft <= 0) return finish(next, 'time');
  if (next.index >= next.deck.length) return finish(next, 'deck');
  return next;
}

/** One second of the clock passing. */
export function tickSession(s: Session): Session {
  if (s.status !== 'playing' || !s.duration) return s;
  const timeLeft = Math.max(0, s.timeLeft - 1);
  const next = { ...s, timeLeft };
  return timeLeft <= 0 ? finish(next, 'time') : next;
}

export function finish(s: Session, reason: EndReason): Session {
  if (s.status === 'finished') return s;
  return { ...s, status: 'finished', endReason: reason };
}

export const currentChallenge = (s: Session) => (s.index < s.deck.length ? resolve(s.deck[s.index]) : null);

/** Team-mode winners (several in case of a tie). */
export function winners(s: Session): Player[] {
  if (!s.players.length) return [];
  const top = Math.max(...s.players.map((p) => p.score));
  return s.players.filter((p) => p.score === top);
}

export function accuracy(s: Pick<Session, 'correct' | 'wrong'>): number | null {
  const answered = s.correct + s.wrong;
  return answered ? Math.round((s.correct / answered) * 100) : null;
}
