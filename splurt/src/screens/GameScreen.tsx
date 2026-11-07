import confetti from 'canvas-confetti';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { playSfx } from '../audio/sfx';
import { Button } from '../components/Button';
import { CardPair } from '../components/CardPair';
import { Controls } from '../components/Controls';
import { FeedbackBurst } from '../components/FeedbackBurst';
import { Modal } from '../components/Modal';
import { StatusRow } from '../components/StatusRow';
import { TopBar } from '../components/TopBar';
import { currentChallenge } from '../logic/session';
import { MODES, type AnswerKind } from '../logic/modes';
import { useApp } from '../state/AppContext';

const END_MESSAGES = { time: "Time's up!", lives: 'Game over!', deck: 'Last card!', quit: 'Game over!' } as const;

export function GameScreen() {
  const { state, answer, tick, endGame, go } = useApp();
  const session = state.session;
  const [exitOpen, setExitOpen] = useState(false);
  const [flash, setFlash] = useState<{ id: number; kind: AnswerKind } | null>(null);
  const shake = useAnimationControls();
  const lastCount = useRef(session?.results.length ?? 0);

  const mode = session ? MODES[session.mode] : null;
  const playing = session?.status === 'playing';

  // Without a session there is nothing to show – head back to the menu.
  useEffect(() => {
    if (!session) go('menu');
  }, [session, go]);

  // Countdown clock (Speed mode). Paused while the exit dialog is open or the tab is hidden.
  const timed = !!mode?.timed;
  useEffect(() => {
    if (!timed || !playing || exitOpen) return;
    const id = window.setInterval(() => {
      if (!document.hidden) tick();
    }, 1000);
    return () => window.clearInterval(id);
  }, [timed, playing, exitOpen, tick]);

  const timeLeft = session?.timeLeft ?? 0;
  useEffect(() => {
    if (timed && playing && timeLeft > 0 && timeLeft <= 10) playSfx('tick');
  }, [timed, playing, timeLeft]);

  // Reactions to a new answer: flash, shake, streak confetti, end-of-game jingle.
  const count = session?.results.length ?? 0;
  useEffect(() => {
    if (!session || count === lastCount.current) {
      lastCount.current = count;
      return;
    }
    lastCount.current = count;
    const kind = session.lastResult;
    if (!kind) return;
    setFlash({ id: count, kind });
    if (kind === 'wrong') {
      void shake.start({ x: [0, -14, 12, -8, 5, 0], transition: { duration: 0.42 } });
      navigator.vibrate?.(60);
    }
    if (session.lastBonus) {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.65 }, colors: ['#ffffff', '#f000a0', '#ffd400', '#19d98b'] });
    }
    if (session.status === 'finished') {
      window.setTimeout(() => playSfx(session.endReason === 'lives' ? 'lose' : 'win'), 250);
    }
  }, [count, session, shake]);

  // Time running out also ends the game without an answer.
  const finished = session?.status === 'finished';
  const finishedByClock = finished && session?.endReason === 'time';
  useEffect(() => {
    if (finishedByClock) playSfx('win');
  }, [finishedByClock]);

  const onAnswer = useCallback(
    (kind: AnswerKind) => {
      if (!playing || exitOpen) return;
      const bonus = mode?.rules.streakBonusEvery && kind === 'correct' && session && (session.streak + 1) % mode.rules.streakBonusEvery === 0;
      playSfx(kind === 'correct' ? (bonus ? 'streak' : 'correct') : kind === 'wrong' ? 'wrong' : 'skip');
      answer(kind);
    },
    [playing, exitOpen, mode, session, answer],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement)?.tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (k === 'c' || k === 'arrowright') onAnswer('correct');
      else if (k === 'w' || k === 'x' || k === 'arrowleft') onAnswer('wrong');
      else if (k === 's' || k === 'arrowdown') onAnswer('skip');
      else if (k === 'escape') setExitOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onAnswer]);

  if (!session || !mode) return null;

  const challenge = currentChallenge(session);
  const total = session.deck.length;
  const showTotal = session.mode !== 'speed';
  const current = Math.min(session.index + 1, total);
  const lowTime = timed && session.timeLeft <= 10;
  const progress = timed ? session.timeLeft / session.duration : session.index / total;
  const currentPlayer = mode.turns ? session.players[session.turn] : null;

  const timerBadge = timed ? (
    <div
      role="timer"
      aria-label={`${session.timeLeft} seconds left`}
      className={`grid size-14 place-items-center rounded-full border-[4px] border-white font-display text-3xl font-bold tabular-nums ${lowTime ? 'animate-timer-warn bg-wrong' : 'bg-ink'}`}
    >
      {session.timeLeft}
    </div>
  ) : (
    <span className="grid size-12 place-items-center text-3xl" aria-label={mode.name} title={mode.name}>
      {mode.emoji}
    </span>
  );

  return (
    <motion.main
      className="splurt-bg pt-safe pb-safe flex h-dvh flex-col px-3 sm:px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <TopBar
        onExit={() => setExitOpen(true)}
        current={current}
        total={showTotal ? total : undefined}
        progress={progress}
        warning={lowTime}
        right={timerBadge}
        barLabel={timed ? 'Time left' : 'Game progress'}
      />
      <StatusRow session={session} />

      <AnimatePresence mode="wait">
        {currentPlayer && playing && (
          <motion.div
            key={session.turn + '-' + session.index}
            initial={{ y: -16, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            className="mx-auto mt-2 rounded-full border-[3px] border-white bg-ink px-5 py-0.5 text-center font-display text-2xl font-bold"
          >
            <span style={{ color: currentPlayer.color }}>{currentPlayer.name}</span>, you're up!
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div animate={shake} className="relative mx-auto mt-3 min-h-0 w-full max-w-6xl flex-1 overflow-hidden">
        <CardPair challenge={challenge} cardKey={session.index} lastResult={session.lastResult} />
        <FeedbackBurst count={count} kind={session.lastResult} bonus={session.lastBonus} />
        <AnimatePresence>
          {finished && (
            <motion.div
              initial={{ opacity: 0, scale: 0.4, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: -3 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="absolute inset-0 z-30 grid place-items-center"
            >
              <div className="rounded-[2rem] border-[6px] border-white bg-ink px-8 py-5 text-center font-display text-5xl font-bold shadow-[0_10px_0_#c90080] sm:text-7xl">
                {END_MESSAGES[session.endReason ?? 'deck']}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <Controls onAnswer={onAnswer} disabled={!playing || exitOpen} />

      <AnimatePresence>
        {flash && (
          <motion.div
            key={flash.id}
            className="pointer-events-none fixed inset-0 z-10"
            style={{ background: flash.kind === 'correct' ? '#19d98b' : flash.kind === 'wrong' ? '#ff4d5e' : '#ffffff' }}
            initial={{ opacity: 0.38 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            onAnimationComplete={() => setFlash(null)}
          />
        )}
      </AnimatePresence>

      <Modal open={exitOpen} title="Leave the game?" onClose={() => setExitOpen(false)}>
        <p className="mb-5 font-hand text-2xl text-white/85">
          Your progress is saved, so you can pick up where you left off any time.
        </p>
        <div className="flex flex-col gap-3">
          <Button variant="green" onClick={() => setExitOpen(false)}>
            Keep playing
          </Button>
          <Button
            variant="white"
            onClick={() => {
              setExitOpen(false);
              go('menu');
            }}
          >
            Save &amp; exit
          </Button>
          <Button
            variant="red"
            onClick={() => {
              setExitOpen(false);
              endGame();
            }}
          >
            End game now
          </Button>
        </div>
      </Modal>
    </motion.main>
  );
}
