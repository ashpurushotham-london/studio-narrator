import type { AnswerKind, ScoringRules } from './modes';

export interface ScoreOutcome {
  points: number;
  streak: number;
  livesLost: number;
  timeDelta: number;
  /** True when this answer earned a streak bonus. */
  bonus: boolean;
}

/** Pure scoring: what does one answer do under a mode's rules? */
export function scoreAnswer(rules: ScoringRules, kind: AnswerKind, streakBefore: number): ScoreOutcome {
  let streak = streakBefore;
  if (kind === 'correct') streak += 1;
  else if (kind === 'wrong' || rules.skipBreaksStreak) streak = 0;

  let points = rules.points[kind];
  let bonus = false;
  if (kind === 'correct' && rules.streakBonusEvery > 0 && streak % rules.streakBonusEvery === 0) {
    points += rules.streakBonusPoints;
    bonus = true;
  }
  return { points, streak, livesLost: rules.livesLost[kind], timeDelta: rules.timeDelta[kind], bonus };
}
