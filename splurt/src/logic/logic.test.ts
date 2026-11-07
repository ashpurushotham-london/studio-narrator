import { describe, expect, it } from 'vitest';
import { CATEGORIES, QUESTIONS } from '../data/questions';
import { RESTRICTIONS, RESTRICTION_MAP, plainLabel } from '../data/restrictions';
import {
  CLASSIC_CARD_COUNT, DAILY_CARD_COUNT, MIN_EXAMPLE_ANSWERS, RECENT_RESTRICTION_WINDOW,
  compatibleRestrictions, dailyDeck, exampleAnswers, generateDeck, resolve,
} from './engine';
import { countSyllables, satisfies } from './restrictionRules';
import { scoreAnswer } from './scoring';
import { MODES, type AnswerKind } from './modes';
import { answerSession, createSession, tickSession, winners, type Session } from './session';
import { appReducer, type AppState } from '../state/appReducer';
import { DEFAULT_SETTINGS } from '../state/types';
import { dailyStreak, emptyStats } from './stats';

const settings = { ...DEFAULT_SETTINGS };

describe('question database', () => {
  it('has 200+ unique prompts across every category', () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(200);
    expect(new Set(QUESTIONS.map((q) => q.text.toLowerCase())).size).toBe(QUESTIONS.length);
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
    for (const c of CATEGORIES) expect(QUESTIONS.filter((q) => q.category === c.id).length).toBeGreaterThanOrEqual(15);
  });
  it('has clean example answers', () => {
    for (const q of QUESTIONS) {
      expect(q.answers.length, q.text).toBeGreaterThanOrEqual(5);
      for (const a of q.answers) expect(a, q.text).toMatch(/^[a-z]+$/);
    }
  });
});

describe('restriction database', () => {
  it('has 50+ unique restrictions covering every type, each with a label', () => {
    expect(RESTRICTIONS.length).toBeGreaterThanOrEqual(50);
    expect(new Set(RESTRICTIONS.map((r) => r.id)).size).toBe(RESTRICTIONS.length);
    const types = new Set(RESTRICTIONS.map((r) => r.spec.type));
    for (const t of ['contains', 'notContains', 'begins', 'ends', 'sequence', 'double', 'noDouble', 'doubleLetter',
      'syllables', 'plural', 'sameEnds', 'containsBoth', 'minLength', 'maxLength']) expect(types.has(t as never), t).toBe(true);
    for (const r of RESTRICTIONS) expect(r.label.length).toBeGreaterThan(3);
  });
  it('labels read naturally', () => {
    const label = (id: string) => plainLabel(RESTRICTION_MAP.get(id)!.label);
    expect(label('contains:y')).toBe('Contains a Y');
    expect(label('notContains:e')).toBe('Does not contain an E');
    expect(label('begins:d')).toBe('Begins with D');
    expect(label('ends:f')).toBe('Ends with F');
    expect(label('doubleLetter:l')).toBe('Contains double L');
    expect(label('syllables:1')).toBe('One syllable');
    expect(label('plural')).toBe('Must be plural');
    expect(label('sameEnds')).toBe('Starts and ends with the same letter');
  });
});

describe('restriction rules', () => {
  const spec = (id: string) => RESTRICTION_MAP.get(id)!.spec;
  it('evaluates each type', () => {
    expect(satisfies(spec('contains:y'), 'Solitaire')).toBe(false);
    expect(satisfies(spec('contains:y'), 'Mystery')).toBe(true);
    expect(satisfies(spec('contains:y'), 'Bay')).toBe(true);
    expect(satisfies(spec('notContains:e'), 'sudoku')).toBe(true);
    expect(satisfies(spec('begins:d'), 'drum')).toBe(true);
    expect(satisfies(spec('ends:f'), 'giraffe')).toBe(false);
    expect(satisfies(spec('ends:f'), 'leaf')).toBe(true);
    expect(satisfies(spec('sequence:ing'), 'rang')).toBe(false);
    expect(satisfies(spec('sequence:ing'), 'swing')).toBe(true);
    expect(satisfies(spec('double'), 'balloon')).toBe(true);
    expect(satisfies(spec('noDouble'), 'balloon')).toBe(false);
    expect(satisfies(spec('doubleLetter:l'), 'ball')).toBe(true);
    expect(satisfies(spec('doubleLetter:l'), 'moon')).toBe(false);
    expect(satisfies(spec('plural'), 'shoes')).toBe(true);
    expect(satisfies(spec('plural'), 'glass')).toBe(false);
    expect(satisfies(spec('sameEnds'), 'tent')).toBe(true);
    expect(satisfies(spec('containsBoth:rt'), 'carpet')).toBe(true);
    expect(satisfies(spec('minLength:8'), 'elephant')).toBe(true);
    expect(satisfies(spec('maxLength:4'), 'tree')).toBe(true);
    expect(satisfies(spec('maxLength:4'), 'train')).toBe(false);
  });
  it('counts syllables sensibly', () => {
    const words: Record<string, number> = { cat: 1, apple: 2, banana: 3, elephant: 3, butterfly: 3, kitchen: 2, house: 1,
      table: 2, orange: 2, spaghetti: 3, television: 4, chocolate: 3, toaster: 2, pizza: 2, whale: 1, giraffe: 2, strike: 1 };
    for (const [w, n] of Object.entries(words)) expect(countSyllables(w), w).toBe(n);
  });
});

describe('challenge engine', () => {
  it('is deterministic for a seed and different for another', () => {
    expect(generateDeck(50, 'a')).toEqual(generateDeck(50, 'a'));
    expect(generateDeck(50, 'a')).not.toEqual(generateDeck(50, 'b'));
  });
  it('builds a 250-card deck of resolvable, answerable challenges', () => {
    const deck = generateDeck(CLASSIC_CARD_COUNT, 'splurt-classic-0');
    expect(deck).toHaveLength(250);
    for (const c of deck) {
      const r = resolve(c)!;
      expect(r).not.toBeNull();
      expect(exampleAnswers(r.question, r.restriction).length).toBeGreaterThanOrEqual(MIN_EXAMPLE_ANSWERS);
    }
  });
  it('never repeats a question until the pool is exhausted, nor a pair at all', () => {
    const deck = generateDeck(CLASSIC_CARD_COUNT, 'repeat-test');
    expect(new Set(deck.map((c) => c.qid)).size).toBe(Math.min(deck.length, QUESTIONS.length));
    const long = generateDeck(QUESTIONS.length + 40, 'repeat-test');
    expect(new Set(long.slice(0, QUESTIONS.length).map((c) => c.qid)).size).toBe(QUESTIONS.length);
    expect(new Set(deck.map((c) => c.qid + c.rid)).size).toBe(deck.length);
    for (let i = 1; i < deck.length; i++) expect(deck[i].qid).not.toBe(deck[i - 1].qid);
  });
  it('avoids reusing restrictions too frequently and uses plenty of variety', () => {
    for (const seed of ['x', 'y', 'z']) {
      const deck = generateDeck(CLASSIC_CARD_COUNT, seed);
      let violations = 0;
      deck.forEach((c, i) => {
        const window = deck.slice(Math.max(0, i - RECENT_RESTRICTION_WINDOW), i).map((d) => d.rid);
        if (window.includes(c.rid)) violations++;
      });
      expect(violations).toBeLessThan(deck.length * 0.02);
      expect(new Set(deck.map((c) => c.rid)).size).toBeGreaterThan(60);
    }
  });
  it('gives every question several possible restrictions (hundreds of combinations)', () => {
    let combos = 0;
    for (const q of QUESTIONS) {
      const n = compatibleRestrictions(q).length;
      expect(n, q.text).toBeGreaterThanOrEqual(15);
      combos += n;
    }
    expect(combos).toBeGreaterThan(5000);
  });
  it('daily deck is stable per date and differs between dates', () => {
    expect(dailyDeck('2026-11-07')).toEqual(dailyDeck('2026-11-07'));
    expect(dailyDeck('2026-11-07')).not.toEqual(dailyDeck('2026-11-08'));
    expect(dailyDeck('2026-11-07')).toHaveLength(DAILY_CARD_COUNT);
  });
});

describe('scoring', () => {
  it('applies streak bonuses and skip rules', () => {
    const r = MODES.survival.rules;
    expect(scoreAnswer(r, 'correct', 3)).toMatchObject({ points: 1, streak: 4, bonus: false });
    expect(scoreAnswer(r, 'correct', 4)).toMatchObject({ points: 3, streak: 5, bonus: true });
    expect(scoreAnswer(r, 'wrong', 4)).toMatchObject({ points: 0, streak: 0, livesLost: 1 });
    expect(scoreAnswer(r, 'skip', 4).streak).toBe(0);
    expect(scoreAnswer(MODES.classic.rules, 'skip', 4).streak).toBe(4);
  });
});

const play = (s: Session, kinds: AnswerKind[]) => kinds.reduce(answerSession, s);

describe('game modes', () => {
  it('classic: tracks counts and progress, finishes at the end of the deck', () => {
    let s = createSession({ mode: 'classic', settings });
    expect(s.deck).toHaveLength(250);
    s = play(s, ['correct', 'wrong', 'skip', 'correct']);
    expect(s).toMatchObject({ index: 4, correct: 2, wrong: 1, skipped: 1, score: 2, status: 'playing' });
    s = play(s, Array(409).fill('correct'));
    expect(s).toMatchObject({ status: 'finished', endReason: 'deck', index: 250 });
  });
  it('speed: clock counts down, ends on time, wrong answers cost nothing by default', () => {
    let s = createSession({ mode: 'speed', settings });
    expect(s.timeLeft).toBe(60);
    s = play(s, ['correct', 'wrong', 'correct']);
    expect(s.score).toBe(2);
    for (let i = 0; i < 59; i++) s = tickSession(s);
    expect(s.status).toBe('playing');
    s = tickSession(s);
    expect(s).toMatchObject({ status: 'finished', endReason: 'time', timeLeft: 0 });
    expect(answerSession(s, 'correct')).toBe(s);
  });
  it('survival: wrong costs a life, ends at zero, tracks best streak', () => {
    let s = createSession({ mode: 'survival', settings: { ...settings, lives: 2 } });
    s = play(s, Array(5).fill('correct'));
    expect(s).toMatchObject({ score: 7, bestStreak: 5 });
    s = play(s, ['wrong']);
    expect(s).toMatchObject({ lives: 1, streak: 0, status: 'playing' });
    s = play(s, ['correct', 'wrong']);
    expect(s).toMatchObject({ lives: 0, status: 'finished', endReason: 'lives', bestStreak: 5 });
  });
  it('team: turns rotate, scores are independent, winner & ties found', () => {
    let s = createSession({ mode: 'team', settings: { ...settings, teamTurns: 2 }, players: ['Ann', 'Bob', ' ', 'Cy'] });
    expect(s.players.map((p) => p.name)).toEqual(['Ann', 'Bob', 'Cy']);
    expect(s.deck).toHaveLength(6);
    s = play(s, ['correct', 'wrong', 'correct', 'correct']);
    expect(s.players.map((p) => p.score)).toEqual([2, 0, 1]);
    expect(s.turn).toBe(1);
    s = play(s, ['skip', 'wrong']);
    expect(s.status).toBe('finished');
    expect(winners(s).map((p) => p.name)).toEqual(['Ann']);
    expect(winners({ ...s, players: s.players.map((p) => ({ ...p, score: 1 })) })).toHaveLength(3);
  });
  it('daily: 12 cards, keyed by date', () => {
    const s = createSession({ mode: 'daily', settings, dailyKey: '2026-11-07' });
    expect(s.deck).toEqual(dailyDeck('2026-11-07'));
    expect(s.dailyKey).toBe('2026-11-07');
  });
});

describe('app reducer / stats', () => {
  const fresh = (): AppState => ({ settings, stats: emptyStats(), session: null });
  it('updates statistics, personal bests and daily completion', () => {
    let st = appReducer(fresh(), { type: 'START', session: createSession({ mode: 'speed', settings }) });
    st = [ 'correct', 'correct', 'wrong', 'skip' ].reduce((a, kind) => appReducer(a, { type: 'ANSWER', kind: kind as AnswerKind }), st);
    expect(st.stats).toMatchObject({ gamesPlayed: 1, correct: 2, wrong: 1, skipped: 1, currentStreak: 0, bestStreak: 2, challengesCompleted: 4 });
    for (let i = 0; i < 60; i++) st = appReducer(st, { type: 'TICK' });
    expect(st.session).toMatchObject({ status: 'finished', newBest: true });
    expect(st.stats.speed.best).toBe(2);

    st = appReducer(st, { type: 'START', session: createSession({ mode: 'daily', settings, dailyKey: '2026-11-07' }) });
    for (let i = 0; i < 12; i++) st = appReducer(st, { type: 'ANSWER', kind: 'correct' });
    expect(st.stats.daily.results['2026-11-07']).toMatchObject({ correct: 12, total: 12 });
    expect(dailyStreak(st.stats, '2026-11-07')).toBe(1);
    expect(st.stats.gamesPlayed).toBe(2);
  });
  it('End game finishes a survival run and records bests', () => {
    let st = appReducer(fresh(), { type: 'START', session: createSession({ mode: 'survival', settings }) });
    st = appReducer(appReducer(st, { type: 'ANSWER', kind: 'correct' }), { type: 'END_GAME' });
    expect(st.session?.endReason).toBe('quit');
    expect(st.stats.survival).toEqual({ bestScore: 1, bestStreak: 1 });
  });
});
