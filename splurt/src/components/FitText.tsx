import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';

interface FitTextProps {
  children: ReactNode;
  /** Re-fit when this changes (usually the plain text). */
  text: string;
  className?: string;
  style?: CSSProperties;
  maxPx?: number;
  minPx?: number;
}

/**
 * Renders text as large as will fit its parent box (binary search on font-size),
 * and refits on resize and once web fonts have loaded.
 */
export function FitText({ children, text, className = '', style, maxPx = 170, minPx = 18 }: FitTextProps) {
  const box = useRef<HTMLDivElement>(null);
  const el = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const b = box.current;
    const p = el.current;
    if (!b || !p) return;

    const fit = () => {
      const w = b.clientWidth;
      const h = b.clientHeight;
      if (!w || !h) return;
      let lo = minPx;
      let hi = Math.min(maxPx, h * 0.9);
      p.style.fontSize = `${hi}px`;
      const fits = () => p.scrollHeight <= h && p.scrollWidth <= w + 1;
      if (fits()) return;
      while (hi - lo > 1) {
        const mid = (lo + hi) / 2;
        p.style.fontSize = `${mid}px`;
        if (fits()) lo = mid;
        else hi = mid;
      }
      p.style.fontSize = `${lo}px`;
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(b);
    void document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [text, maxPx, minPx]);

  return (
    <div ref={box} className="flex h-full w-full items-center justify-center">
      <p ref={el} className={`card-text w-full text-center ${className}`} style={style}>
        {children}
      </p>
    </div>
  );
}
