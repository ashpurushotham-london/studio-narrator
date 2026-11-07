import { QUESTIONS, QUESTION_MAP, type Question } from '../data/questions';
import { RESTRICTIONS, RESTRICTION_MAP, type Restriction } from '../data/restrictions';
import { createRng, shuffle, type Rng } from './rng';
import { satisfies } from './restrictionRules';

/** A challenge is a pair of card ids: the pink question and the black restriction. */
export interface Challenge {
  qid: string;
  rid: string;
}

export interface ResolvedChallenge {
  question: Question;
  restriction: Restriction;
}

/** A restriction is "reasonably answerable" if this many example answers satisfy it. */
export const MIN_EXAMPLE_ANSWERS = 3;
/** How many recent restrictions must not be reused. */
export const RECENT_RESTRICTION_WINDOW = 12;

const compatCache = new Map<string, Restriction[]>();

/** Restrictions that can be answered for this question, according to its example answers. */
export function compatibleRestrictions(question: Question): Restriction[] {
  const cached = compatCache.get(question.id);
  if (cached) return cached;
  const list = RESTRICTIONS.filter((r) => exampleAnswers(question, r).length >= MIN_EXAMPLE_ANSWERS);
  compatCache.set(question.id, list);
  return list;
}

/** Example answers that satisfy a restriction (plurals are always possible for countable things). */
export function exampleAnswers(question: Question, restriction: Restriction): string[] {
  if (restriction.spec.type === 'plural') {
    const pluralAnswers = question.answers.filter((a) => satisfies(restriction.spec, a));
    return question.countable ? question.answers : pluralAnswers;
  }
  return question.answers.filter((a) => satisfies(restriction.spec, a));
}

export function resolve(challenge: Challenge): ResolvedChallenge | null {
  const question = QUESTION_MAP.get(challenge.qid);
  const restriction = RESTRICTION_MAP.get(challenge.rid);
  return question && restriction ? { question, restriction } : null;
}

export function isValidDeck(deck: Challenge[]): boolean {
  return deck.every((c) => resolve(c) !== null);
}

/** Restrictions of the same "family" feel repetitive back-to-back. */
const family = (r: Restriction) => r.spec.type;

function pickWeighted<T>(items: T[], weight: (t: T) => number, rng: Rng): T {
  let total = 0;
  const weights = items.map((i) => {
    const w = Math.max(0.0001, weight(i));
    total += w;
    return w;
  });
  let roll = rng() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

export interface DeckOptions {
  /** Limit the question pool (defaults to all). */
  questions?: readonly Question[];
}

/**
 * Build a deck of `count` challenges from a seed.
 *  - Questions are dealt from shuffled passes, so none repeats until the whole pool is used.
 *  - A restriction is not reused within RECENT_RESTRICTION_WINDOW cards, and the same
 *    restriction family (e.g. "begins with") is avoided back-to-back.
 *  - Less-used restrictions are favoured, so variety stays high across hundreds of cards.
 *  - Only restrictions with enough example answers for the question are paired with it.
 */
export function generateDeck(count: number, seed: string | number, options: DeckOptions = {}): Challenge[] {
  const rng = createRng(seed);
  const pool = options.questions ?? QUESTIONS;
  const deck: Challenge[] = [];
  const usage = new Map<string, number>();
  const usedPairs = new Set<string>();
  const recent: Restriction[] = [];

  let order: Question[] = [];
  let cursor = 0;
  const nextQuestion = (): Question => {
    if (cursor >= order.length) {
      const previous = order[order.length - 1];
      order = shuffle(pool, rng);
      if (previous && order.length > 1 && order[0].id === previous.id) {
        [order[0], order[1]] = [order[1], order[0]];
      }
      cursor = 0;
    }
    return order[cursor++];
  };

  for (let i = 0; i < count; i++) {
    const question = nextQuestion();
    const all = compatibleRestrictions(question);
    const recentIds = new Set(recent.map((r) => r.id));
    const lastFamily = recent.length ? family(recent[recent.length - 1]) : null;

    const tiers: Restriction[][] = [
      all.filter((r) => !recentIds.has(r.id) && family(r) !== lastFamily && !usedPairs.has(question.id + r.id)),
      all.filter((r) => !recentIds.has(r.id) && !usedPairs.has(question.id + r.id)),
      all.filter((r) => !recentIds.has(r.id)),
      all,
    ];
    const candidates = tiers.find((t) => t.length > 0) ?? RESTRICTIONS.slice();

    const chosen = pickWeighted(
      candidates,
      (r) => {
        const answers = exampleAnswers(question, r).length;
        const share = answers / question.answers.length;
        const easyPenalty = share > 0.85 ? 0.35 : 1; // trivially easy restrictions appear less often
        return easyPenalty / (1 + (usage.get(r.id) ?? 0) * 0.6);
      },
      rng,
    );

    deck.push({ qid: question.id, rid: chosen.id });
    usage.set(chosen.id, (usage.get(chosen.id) ?? 0) + 1);
    usedPairs.add(question.id + chosen.id);
    recent.push(chosen);
    if (recent.length > RECENT_RESTRICTION_WINDOW) recent.shift();
  }
  return deck;
}

/** Local calendar day key, e.g. 2026-11-07. */
export function dateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const DAILY_CARD_COUNT = 12;
export const CLASSIC_CARD_COUNT = 413;

/** The same date always yields the same daily set. */
export function dailyDeck(key: string = dateKey()): Challenge[] {
  return generateDeck(DAILY_CARD_COUNT, `splurt-daily-${key}`);
}
