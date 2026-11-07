import { Check, SkipForward, X } from 'lucide-react';
import { BlackCard, PinkCard } from '../components/Cards';
import { Screen } from '../components/Screen';
import { MODE_ORDER, MODES } from '../logic/modes';

const steps = [
  'Read the pink card: it asks for something.',
  'Read the black card: it puts a rule on your word.',
  'Think of ONE word that answers the pink card AND obeys the black card.',
  'Be honest! Tap Correct if you found one, Wrong if you could not, or Skip to pass.',
];

export function HowToScreen() {
  return (
    <Screen title="How to play" back="menu">
      <div className="mx-auto mb-5 grid h-64 grid-cols-2 gap-3 sm:h-72">
        <PinkCard text="Something you find in a kitchen" />
        <BlackCard label="Contains a [K]" />
      </div>
      <p className="mb-4 text-center font-hand text-2xl">
        A kettle or a knife would do nicely: both are kitchen things with a K!
      </p>

      <ol className="mb-6 flex flex-col gap-2">
        {steps.map((s, i) => (
          <li key={i} className="sticker flex items-center gap-3 px-4 py-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-splurt font-display text-xl font-bold text-white">{i + 1}</span>
            <span className="font-hand text-xl leading-snug">{s}</span>
          </li>
        ))}
      </ol>

      <h2 className="mb-2 font-display text-2xl font-bold">The buttons</h2>
      <ul className="mb-6 grid gap-2 font-hand text-xl">
        <li className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl border-[3px] border-white bg-wrong"><X strokeWidth={4} /></span> Wrong: no valid word. Key: W or ←</li>
        <li className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl border-[3px] border-white bg-white text-ink"><SkipForward strokeWidth={3} /></span> Skip: pass this card. Key: S or ↓</li>
        <li className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl border-[3px] border-white bg-correct text-ink"><Check strokeWidth={4} /></span> Correct: found a word. Key: C or →</li>
      </ul>

      <h2 className="mb-2 font-display text-2xl font-bold">Game modes</h2>
      <ul className="mb-6 flex flex-col gap-2 pb-4">
        {MODE_ORDER.map((id) => (
          <li key={id} className="flex gap-3 rounded-2xl border-[3px] border-white/60 bg-black/15 px-4 py-2">
            <span className="text-3xl">{MODES[id].emoji}</span>
            <span>
              <span className="block font-display text-xl font-bold">{MODES[id].name}</span>
              <span className="font-hand text-xl leading-snug">{MODES[id].tagline}</span>
            </span>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
