import { Fragment, type ReactNode } from 'react';
import { FitText } from './FitText';
import { Logo } from './Logo';

interface FrameProps {
  tone: 'pink' | 'black';
  children: ReactNode;
  className?: string;
  label: string;
}

function CardFrame({ tone, children, className = '', label }: FrameProps) {
  const bg = tone === 'pink' ? 'bg-splurt' : 'bg-ink';
  return (
    <section
      aria-label={label}
      className={`card-shell relative h-full w-full overflow-hidden rounded-[2rem] border-[7px] border-white shadow-[0_10px_0_0_rgba(0,0,0,0.28)] sm:border-[10px] sm:rounded-[2.5rem] ${bg} ${className}`}
    >
      {children}
    </section>
  );
}

/** The pink question card (left on desktop, top on mobile). */
export function PinkCard({ text }: { text: string }) {
  return (
    <CardFrame tone="pink" label="Question card">
      <div className="absolute inset-0 flex flex-col items-center px-[7cqw] pt-[6cqh] pb-[3cqh]">
        <div className="min-h-0 w-full flex-1">
          <FitText text={text} className="text-white" style={{ textShadow: '0 0.04em 0 rgba(120,0,80,0.45)' }}>
            {text}
          </FitText>
        </div>
        <Logo size="clamp(1.6rem, min(11cqmin, 9cqh), 3.2rem)" className="mt-2 shrink-0 opacity-95" />
      </div>
    </CardFrame>
  );
}

/** Turn "Contains a [Y]" into text with the key letters highlighted. */
function Highlighted({ label }: { label: string }) {
  const parts = label.split(/(\[[^\]]+\])/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('[') ? (
          <span key={i} className="text-splurt" style={{ textShadow: '0 0 0.35em rgba(240,0,160,0.55)' }}>
            {p.slice(1, -1)}
          </span>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

/** The black restriction card (right on desktop, bottom on mobile). */
export function BlackCard({ label }: { label: string }) {
  const plain = label.replace(/[[\]]/g, '');
  return (
    <CardFrame tone="black" label="Restriction card">
      <div className="absolute inset-0 px-[7cqw] py-[6cqh]">
        <FitText text={plain} className="text-white">
          <Highlighted label={label} />
        </FitText>
      </div>
    </CardFrame>
  );
}
