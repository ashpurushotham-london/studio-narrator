/** Tiny synthesised sound effects (Web Audio, no asset files). */

export type Sfx = 'tap' | 'correct' | 'wrong' | 'skip' | 'tick' | 'whoosh' | 'win' | 'lose' | 'streak';

let ctx: AudioContext | null = null;
let enabled = true;

export const setSoundEnabled = (on: boolean) => {
  enabled = on;
};

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface Note {
  freq: number;
  start: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  slideTo?: number;
}

function play(notes: Note[]) {
  const c = audio();
  if (!c) return;
  const now = c.currentTime;
  for (const n of notes) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = n.type ?? 'sine';
    osc.frequency.setValueAtTime(n.freq, now + n.start);
    if (n.slideTo) osc.frequency.exponentialRampToValueAtTime(n.slideTo, now + n.start + n.dur);
    const peak = n.gain ?? 0.12;
    g.gain.setValueAtTime(0.0001, now + n.start);
    g.gain.exponentialRampToValueAtTime(peak, now + n.start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.dur);
    osc.connect(g).connect(c.destination);
    osc.start(now + n.start);
    osc.stop(now + n.start + n.dur + 0.02);
  }
}

const SOUNDS: Record<Sfx, Note[]> = {
  tap: [{ freq: 520, start: 0, dur: 0.06, type: 'triangle', gain: 0.08 }],
  correct: [
    { freq: 660, start: 0, dur: 0.12, type: 'triangle' },
    { freq: 880, start: 0.08, dur: 0.12, type: 'triangle' },
    { freq: 1175, start: 0.16, dur: 0.22, type: 'triangle' },
  ],
  wrong: [
    { freq: 220, start: 0, dur: 0.16, type: 'sawtooth', gain: 0.08, slideTo: 150 },
    { freq: 150, start: 0.12, dur: 0.24, type: 'sawtooth', gain: 0.08, slideTo: 90 },
  ],
  skip: [{ freq: 700, start: 0, dur: 0.14, type: 'sine', gain: 0.09, slideTo: 380 }],
  tick: [{ freq: 1000, start: 0, dur: 0.05, type: 'square', gain: 0.04 }],
  whoosh: [{ freq: 300, start: 0, dur: 0.18, type: 'sine', gain: 0.05, slideTo: 900 }],
  streak: [
    { freq: 784, start: 0, dur: 0.1, type: 'triangle' },
    { freq: 988, start: 0.07, dur: 0.1, type: 'triangle' },
    { freq: 1318, start: 0.14, dur: 0.1, type: 'triangle' },
    { freq: 1568, start: 0.21, dur: 0.28, type: 'triangle' },
  ],
  win: [
    { freq: 523, start: 0, dur: 0.14, type: 'triangle' },
    { freq: 659, start: 0.12, dur: 0.14, type: 'triangle' },
    { freq: 784, start: 0.24, dur: 0.14, type: 'triangle' },
    { freq: 1047, start: 0.36, dur: 0.4, type: 'triangle' },
  ],
  lose: [
    { freq: 392, start: 0, dur: 0.2, type: 'triangle', gain: 0.1 },
    { freq: 330, start: 0.18, dur: 0.2, type: 'triangle', gain: 0.1 },
    { freq: 262, start: 0.36, dur: 0.4, type: 'triangle', gain: 0.1 },
  ],
};

export function playSfx(name: Sfx) {
  if (!enabled) return;
  play(SOUNDS[name]);
}
