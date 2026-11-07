/**
 * Restriction database (the black cards).
 *
 * Declarative: each spec says what rule applies, and `buildRestrictions` expands
 * them into concrete restrictions with a display label. The rule evaluation lives
 * in logic/restrictionRules.ts.
 *
 * Label markup: text wrapped in [square brackets] is highlighted on the card.
 */

export type RestrictionSpec =
  | { type: 'contains'; letter: string }
  | { type: 'notContains'; letter: string }
  | { type: 'begins'; letter: string }
  | { type: 'ends'; letter: string }
  | { type: 'sequence'; seq: string }
  | { type: 'double' }
  | { type: 'noDouble' }
  | { type: 'doubleLetter'; letter: string }
  | { type: 'syllables'; n: number }
  | { type: 'plural' }
  | { type: 'sameEnds' }
  | { type: 'containsBoth'; a: string; b: string }
  | { type: 'minLength'; n: number }
  | { type: 'maxLength'; n: number };

export type RestrictionType = RestrictionSpec['type'];

export interface Restriction {
  id: string;
  spec: RestrictionSpec;
  /** Label with [highlight] markup, e.g. "Contains a [Y]" */
  label: string;
}

const AN_LETTERS = new Set('AEFHILMNORSX'.split(''));
export const article = (letter: string) => (AN_LETTERS.has(letter.toUpperCase()) ? 'an' : 'a');

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const SYLLABLE_WORDS = ['One', 'Two', 'Three', 'Four'];

/** The specs that make up the database. */
export const RESTRICTION_SPECS: RestrictionSpec[] = [
  ...ALPHABET.map((letter): RestrictionSpec => ({ type: 'contains', letter })),
  ...'AEIOURSTNLDH'.split('').map((letter): RestrictionSpec => ({ type: 'notContains', letter })),
  ...ALPHABET.filter((l) => l !== 'X').map((letter): RestrictionSpec => ({ type: 'begins', letter })),
  ...'ADEFGHKLMNOPRSTWY'.split('').map((letter): RestrictionSpec => ({ type: 'ends', letter })),
  ...['ER', 'ING', 'AT', 'ON', 'AN', 'ST', 'TH', 'OO', 'EA', 'OU', 'CH', 'SH', 'AR', 'IN', 'RE', 'LE', 'OR'].map(
    (seq): RestrictionSpec => ({ type: 'sequence', seq }),
  ),
  { type: 'double' },
  { type: 'noDouble' },
  ...'LESTORPM'.split('').map((letter): RestrictionSpec => ({ type: 'doubleLetter', letter })),
  ...[1, 2, 3, 4].map((n): RestrictionSpec => ({ type: 'syllables', n })),
  { type: 'plural' },
  { type: 'sameEnds' },
  ...(
    [
      ['R', 'T'],
      ['S', 'P'],
      ['B', 'L'],
      ['M', 'N'],
      ['C', 'K'],
      ['W', 'H'],
      ['D', 'G'],
      ['A', 'Y'],
      ['O', 'U'],
      ['P', 'E'],
      ['F', 'L'],
      ['T', 'H'],
    ] as const
  ).map(([a, b]): RestrictionSpec => ({ type: 'containsBoth', a, b })),
  ...[6, 7, 8, 9].map((n): RestrictionSpec => ({ type: 'minLength', n })),
  ...[3, 4, 5, 6].map((n): RestrictionSpec => ({ type: 'maxLength', n })),
];

export function specId(spec: RestrictionSpec): string {
  switch (spec.type) {
    case 'contains':
    case 'notContains':
    case 'begins':
    case 'ends':
    case 'doubleLetter':
      return `${spec.type}:${spec.letter.toLowerCase()}`;
    case 'sequence':
      return `sequence:${spec.seq.toLowerCase()}`;
    case 'syllables':
    case 'minLength':
    case 'maxLength':
      return `${spec.type}:${spec.n}`;
    case 'containsBoth':
      return `containsBoth:${spec.a.toLowerCase()}${spec.b.toLowerCase()}`;
    default:
      return spec.type;
  }
}

export function specLabel(spec: RestrictionSpec): string {
  switch (spec.type) {
    case 'contains':
      return `Contains ${article(spec.letter)} [${spec.letter}]`;
    case 'notContains':
      return `Does not contain ${article(spec.letter)} [${spec.letter}]`;
    case 'begins':
      return `Begins with [${spec.letter}]`;
    case 'ends':
      return `Ends with [${spec.letter}]`;
    case 'sequence':
      return `Contains the letters [${spec.seq}]`;
    case 'double':
      return 'Contains a [double letter]';
    case 'noDouble':
      return 'Has [no double letters]';
    case 'doubleLetter':
      return `Contains double [${spec.letter}]`;
    case 'syllables':
      return `[${SYLLABLE_WORDS[spec.n - 1] ?? spec.n}] ${spec.n === 1 ? 'syllable' : 'syllables'}`;
    case 'plural':
      return 'Must be [plural]';
    case 'sameEnds':
      return 'Starts and ends with the [same letter]';
    case 'containsBoth':
      return `Contains both ${article(spec.a)} [${spec.a}] and ${article(spec.b)} [${spec.b}]`;
    case 'minLength':
      return `At least [${spec.n}] letters long`;
    case 'maxLength':
      return `[${spec.n}] letters or fewer`;
  }
}

export function buildRestrictions(specs: RestrictionSpec[] = RESTRICTION_SPECS): Restriction[] {
  return specs.map((spec) => ({ id: specId(spec), spec, label: specLabel(spec) }));
}

export const RESTRICTIONS: readonly Restriction[] = buildRestrictions();
export const RESTRICTION_MAP: ReadonlyMap<string, Restriction> = new Map(RESTRICTIONS.map((r) => [r.id, r]));

/** Strip the [highlight] markup. */
export const plainLabel = (label: string) => label.replace(/[[\]]/g, '');
