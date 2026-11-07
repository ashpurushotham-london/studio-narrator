import type { ModeId } from '../logic/modes';

export interface Settings {
  sound: boolean;
  /** Starting lives for Survival mode. */
  lives: number;
  /** Speed mode length in seconds. */
  speedSeconds: number;
  /** Turns each player gets in Team mode. */
  teamTurns: number;
  lastMode: ModeId;
  lastPlayers: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  lives: 3,
  speedSeconds: 60,
  teamTurns: 5,
  lastMode: 'classic',
  lastPlayers: ['Player 1', 'Player 2'],
};

export const LIMITS = {
  lives: { min: 1, max: 10 },
  speedSeconds: [30, 60, 90, 120],
  teamTurns: [3, 5, 8, 10],
  maxPlayers: 4,
  minPlayers: 2,
} as const;
