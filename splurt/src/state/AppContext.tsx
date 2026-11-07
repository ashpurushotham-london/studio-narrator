import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { setSoundEnabled } from '../audio/sfx';
import type { AnswerKind, ModeId } from '../logic/modes';
import { createSession, type Session } from '../logic/session';
import { clearAll, loadSession, loadSettings, loadStats, saveSession, saveSettings, saveStats } from '../storage/storage';
import { appReducer, type AppState } from './appReducer';
import type { Settings } from './types';

export type ScreenId = 'menu' | 'modes' | 'teamSetup' | 'game' | 'results' | 'stats' | 'settings' | 'howto';

interface AppContextValue {
  state: AppState;
  screen: ScreenId;
  go: (screen: ScreenId) => void;
  /** Begin a brand-new game in a mode (replaces any saved game). */
  start: (mode: ModeId, players?: string[]) => void;
  /** Return to a saved, unfinished game. */
  resume: () => void;
  answer: (kind: AnswerKind) => void;
  tick: () => void;
  endGame: () => void;
  /** Leave the results screen and discard the finished session. */
  leaveResults: (to?: ScreenId) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
}

const Ctx = createContext<AppContextValue | null>(null);

function initState(): AppState {
  const session = loadSession();
  return { settings: loadSettings(), stats: loadStats(), session };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, initState);
  // A finished game that was on screen when the page refreshed goes straight back to its results.
  const [screen, setScreen] = useState<ScreenId>(() => (state.session?.status === 'finished' ? 'results' : 'menu'));

  useEffect(() => saveSettings(state.settings), [state.settings]);
  useEffect(() => saveStats(state.stats), [state.stats]);
  useEffect(() => saveSession(state.session), [state.session]);
  useEffect(() => setSoundEnabled(state.settings.sound), [state.settings.sound]);

  // When a game ends (deck used up, clock out, no lives) move to the results screen.
  const finished = state.session?.status === 'finished';
  useEffect(() => {
    if (finished && screen === 'game') {
      const t = window.setTimeout(() => setScreen('results'), 750);
      return () => window.clearTimeout(t);
    }
  }, [finished, screen]);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      screen,
      go: setScreen,
      start: (mode, players) => {
        const session: Session = createSession({
          mode,
          settings: state.settings,
          players,
          classicRun: state.stats.classic.boxesCompleted,
        });
        dispatch({ type: 'START', session });
        if (players) dispatch({ type: 'SETTINGS', patch: { lastPlayers: players } });
        setScreen('game');
      },
      resume: () => setScreen(state.session?.status === 'finished' ? 'results' : 'game'),
      answer: (kind) => dispatch({ type: 'ANSWER', kind }),
      tick: () => dispatch({ type: 'TICK' }),
      endGame: () => dispatch({ type: 'END_GAME' }),
      leaveResults: (to = 'menu') => {
        dispatch({ type: 'CLEAR_SESSION' });
        setScreen(to);
      },
      updateSettings: (patch) => dispatch({ type: 'SETTINGS', patch }),
      resetAll: () => {
        clearAll();
        dispatch({ type: 'RESET_ALL' });
        setScreen('menu');
      },
    }),
    [state, screen],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppProvider');
  return v;
}

/** Handy for components that only care about the running session. */
export const useSession = () => useApp().state.session;

