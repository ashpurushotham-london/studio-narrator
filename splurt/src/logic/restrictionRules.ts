import type { RestrictionSpec } from '../data/restrictions';

const clean = (w: string) => w.toLowerCase().replace(/[^a-z]/g, '');

/** Words the vowel-group heuristic gets wrong. */
const SYLLABLE_OVERRIDES: Record<string, number> = {
  people: 2, simple: 2, giraffe: 2, lion: 2, quiet: 2, diamond: 3, violin: 3, ruler: 2, poem: 2,
  science: 2, idea: 3, area: 3, real: 2, hour: 1, fire: 1, our: 1, tired: 1, every: 3, different: 3,
  family: 3, chocolate: 3, camera: 3, vegetable: 4, favourite: 3, business: 2, evening: 2, jewellery: 3,
  jeweller: 3, ukulele: 4, guitar: 2, bicycle: 3, ocean: 2, create: 2, being: 2, cereal: 3, theatre: 3,
  museum: 3, stadium: 3, radio: 3, video: 3, piano: 3, koala: 3, panda: 2, kayak: 2, tiara: 3, genie: 2,
  cooked: 1, baked: 1, opossum: 3, possum: 2, whale: 1, shale: 1, rhythm: 2, bottle: 2, castle: 2,
  middle: 2, giant: 2, scooter: 2, wifi: 2, hairdryer: 3, pyramids: 3, pyramid: 3, fuji: 2, bluey: 2,
  gandalf: 2, hulk: 1, bear: 1, beer: 1, chair: 1, aeroplane: 3, millennium: 4, thunder: 2, tsunami: 3,
  tornado: 3, volcano: 3, tomato: 3, potato: 3, banana: 3, mosquito: 4, pajamas: 3, bowling: 2, tattoo: 2,
  tuesday: 2, lasagne: 3, tagliatelle: 4, linguine: 3, farfalle: 3, rigatoni: 4, hullabaloo: 4,
};

/** Rough English syllable counter (vowel groups with a few adjustments). */
export function countSyllables(raw: string): number {
  const word = clean(raw);
  if (!word) return 0;
  if (SYLLABLE_OVERRIDES[word] !== undefined) return SYLLABLE_OVERRIDES[word];
  if (word.length <= 3) return 1;
  let w = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  w = w.replace(/^y/, '');
  const groups = w.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

/** Heuristic plural check for English nouns. */
export function isPlural(raw: string): boolean {
  const w = clean(raw);
  if (w.length < 3) return false;
  if (/(ss|us|is|ous)$/.test(w)) return false;
  return w.endsWith('s') || /^(men|women|children|mice|geese|teeth|feet|people)$/.test(w) || w.endsWith('i');
}

export function hasDoubleLetter(raw: string): boolean {
  return /(.)\1/.test(clean(raw));
}

/** Does the (single) word satisfy the restriction? */
export function satisfies(spec: RestrictionSpec, raw: string): boolean {
  const w = clean(raw);
  if (!w) return false;
  switch (spec.type) {
    case 'contains':
      return w.includes(spec.letter.toLowerCase());
    case 'notContains':
      return !w.includes(spec.letter.toLowerCase());
    case 'begins':
      return w.startsWith(spec.letter.toLowerCase());
    case 'ends':
      return w.endsWith(spec.letter.toLowerCase());
    case 'sequence':
      return w.includes(spec.seq.toLowerCase());
    case 'double':
      return hasDoubleLetter(w);
    case 'noDouble':
      return !hasDoubleLetter(w);
    case 'doubleLetter': {
      const l = spec.letter.toLowerCase();
      return w.includes(l + l);
    }
    case 'syllables':
      return countSyllables(w) === spec.n;
    case 'plural':
      return isPlural(w);
    case 'sameEnds':
      return w.length > 1 && w[0] === w[w.length - 1];
    case 'containsBoth':
      return w.includes(spec.a.toLowerCase()) && w.includes(spec.b.toLowerCase());
    case 'minLength':
      return w.length >= spec.n;
    case 'maxLength':
      return w.length <= spec.n;
  }
}
