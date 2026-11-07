import { motion } from 'framer-motion';
import { playSfx } from '../audio/sfx';

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => {
        onChange(!on);
        playSfx('tap');
      }}
      className={`relative h-10 w-[4.5rem] shrink-0 cursor-pointer rounded-full border-[3px] border-white transition-colors ${on ? 'bg-correct' : 'bg-ink/60'}`}
    >
      <motion.span
        className="absolute top-0.5 size-7 rounded-full bg-white shadow"
        animate={{ left: on ? 'calc(100% - 2rem)' : '0.125rem' }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

export function Stepper({
  value, min, max, onChange, label,
}: { value: number; min: number; max: number; onChange: (v: number) => void; label: string }) {
  const btn = 'grid size-11 cursor-pointer place-items-center rounded-full border-[3px] border-white bg-white/15 text-3xl font-bold leading-none disabled:opacity-30';
  return (
    <div className="flex items-center gap-3" role="group" aria-label={label}>
      <button className={btn} aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => { onChange(value - 1); playSfx('tap'); }}>−</button>
      <span className="w-8 text-center font-display text-3xl font-bold" aria-live="polite">{value}</span>
      <button className={btn} aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => { onChange(value + 1); playSfx('tap'); }}>+</button>
    </div>
  );
}

export function Segmented<T extends number | string>({
  options, value, onChange, label, format = String,
}: { options: readonly T[]; value: T; onChange: (v: T) => void; label: string; format?: (v: T) => string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1.5">
      {options.map((o) => (
        <button
          key={String(o)}
          role="radio"
          aria-checked={o === value}
          onClick={() => { onChange(o); playSfx('tap'); }}
          className={`min-w-12 cursor-pointer rounded-xl border-[3px] border-white px-3 py-1.5 font-display text-xl font-bold transition-colors ${o === value ? 'bg-white text-splurt' : 'bg-white/10 text-white'}`}
        >
          {format(o)}
        </button>
      ))}
    </div>
  );
}
