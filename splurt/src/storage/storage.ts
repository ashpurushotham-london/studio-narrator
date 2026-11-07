import { isValidDeck } from '../logic/engine';
import { emptyStats, type Stats } from '../logic/stats';
import type { Session } from '../logic/session';
import { DEFAULT_SETTINGS, type Settings } from '../state/types';

/** All persistence goes through here (LocalStorage today – swap the backend later). */
const KEYS = {
  settings: 'splurt.v1.settings',
  stats: 'splurt.v1.stats',
  session: 'splurt.v1.session',
} as const;

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable – the game keeps working in memory */
  }
}

function remove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function loadSettings(): Settings {
  const saved = read<Partial<Settings>>(KEYS.settings);
  return { ...DEFAULT_SETTINGS, ...(saved ?? {}) };
}

export function loadStats(): Stats {
  const saved = read<Partial<Stats>>(KEYS.stats);
  const base = emptyStats();
  if (!saved) return base;
  return {
    ...base,
    ...saved,
    byMode: { ...base.byMode, ...(saved.byMode ?? {}) },
    classic: { ...base.classic, ...(saved.classic ?? {}) },
    speed: { ...base.speed, ...(saved.speed ?? {}) },
    survival: { ...base.survival, ...(saved.survival ?? {}) },
    daily: { results: { ...(saved.daily?.results ?? {}) } },
  };
}

export function loadSession(): Session | null {
  const saved = read<Session>(KEYS.session);
  if (!saved || !Array.isArray(saved.deck) || !isValidDeck(saved.deck)) return null;
  return saved;
}

export const saveSettings = (s: Settings) => write(KEYS.settings, s);
export const saveStats = (s: Stats) => write(KEYS.stats, s);
export const saveSession = (s: Session | null) => (s ? write(KEYS.session, s) : remove(KEYS.session));

export function clearAll(): void {
  Object.values(KEYS).forEach(remove);
}
