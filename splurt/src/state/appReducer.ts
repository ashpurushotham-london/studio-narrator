import type { AnswerKind } from '../logic/modes';
import { MODES } from '../logic/modes';
import { answerSession, finish, tickSession, type Session } from '../logic/session';
import { emptyStats, recordAnswer, recordFinish, type Stats } from '../logic/stats';
import { DEFAULT_SETTINGS, type Settings } from './types';

export interface AppState {
  settings: Settings;
  stats: Stats;
  /** The game in progress (or just finished, until the results screen is left). */
  session: Session | null;
}

export type AppAction =
  | { type: 'START'; session: Session }
  | { type: 'ANSWER'; kind: AnswerKind }
  | { type: 'TICK' }
  | { type: 'END_GAME' }
  | { type: 'CLEAR_SESSION' }
  | { type: 'SETTINGS'; patch: Partial<Settings> }
  | { type: 'RESET_ALL' };

function afterTransition(prev: Session, next: Session, stats: Stats): { session: Session; stats: Stats } {
  if (prev.status === 'playing' && next.status === 'finished') {
    const { stats: finished, newBest } = recordFinish(stats, next);
    return { session: { ...next, newBest }, stats: finished };
  }
  return { session: next, stats };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'START':
      return { ...state, session: action.session, settings: { ...state.settings, lastMode: action.session.mode } };

    case 'ANSWER': {
      const s = state.session;
      if (!s || s.status !== 'playing' || s.index >= s.deck.length) return state;
      const stats = recordAnswer(state.stats, s.mode, action.kind, s.index === 0);
      const result = afterTransition(s, answerSession(s, action.kind), stats);
      return { ...state, session: result.session, stats: result.stats };
    }

    case 'TICK': {
      const s = state.session;
      if (!s || s.status !== 'playing' || !MODES[s.mode].timed) return state;
      const result = afterTransition(s, tickSession(s), state.stats);
      return { ...state, session: result.session, stats: result.stats };
    }

    case 'END_GAME': {
      const s = state.session;
      if (!s || s.status !== 'playing') return state;
      const result = afterTransition(s, finish(s, 'quit'), state.stats);
      return { ...state, session: result.session, stats: result.stats };
    }

    case 'CLEAR_SESSION':
      return { ...state, session: null };

    case 'SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case 'RESET_ALL':
      return { settings: { ...DEFAULT_SETTINGS }, stats: emptyStats(), session: null };
  }
}
