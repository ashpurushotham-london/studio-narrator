import { motion } from 'framer-motion';
import { BarChart3, CircleHelp, Play, Settings, Volume2, VolumeX } from 'lucide-react';
import { playSfx } from '../audio/sfx';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Logo } from '../components/Logo';
import { useApp } from '../state/AppContext';

const BLOBS = [
  { x: '8%', y: '12%', s: 90, d: 0, c: '#C90080' },
  { x: '82%', y: '18%', s: 60, d: 0.6, c: '#ffffff33' },
  { x: '12%', y: '78%', s: 70, d: 1.1, c: '#ffffff33' },
  { x: '86%', y: '72%', s: 110, d: 0.3, c: '#C90080' },
];

export function MenuScreen() {
  const { state, go, start, resume, updateSettings } = useApp();
  const [confirmNew, setConfirmNew] = useState(false);
  const { session, settings } = state;
  const saved = session && session.status === 'playing' ? session : null;

  return (
    <motion.main
      className="splurt-bg relative flex h-dvh flex-col items-center justify-center gap-8 overflow-hidden px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
    >
      {BLOBS.map((b, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute rounded-full"
          style={{ left: b.x, top: b.y, width: b.s, height: b.s, background: b.c }}
          animate={{ y: [0, -18, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: b.d }}
        />
      ))}

      <button
        aria-label={settings.sound ? 'Mute sounds' : 'Unmute sounds'}
        onClick={() => {
          updateSettings({ sound: !settings.sound });
          if (!settings.sound) setTimeout(() => playSfx('tap'), 30);
        }}
        className="pt-safe absolute right-4 top-3 grid size-12 cursor-pointer place-items-center rounded-full border-[3px] border-white bg-white/15"
      >
        {settings.sound ? <Volume2 size={24} strokeWidth={3} /> : <VolumeX size={24} strokeWidth={3} />}
      </button>

      <div className="z-10 flex flex-col items-center gap-3 text-center">
        <motion.div animate={{ rotate: [-2, 2, -2] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
          <Logo size="clamp(4.5rem, 22vw, 9rem)" animated />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="font-hand text-2xl text-white sm:text-3xl"
        >
          One pink card. One black card. One word that fits both!
        </motion.p>
      </div>

      <div className="z-10 flex w-full max-w-sm flex-col items-stretch gap-4">
        {saved && (
          <Button variant="green" size="lg" icon={<Play fill="currentColor" size={22} />} onClick={resume}>
            Resume
            <span className="rounded-full bg-ink/15 px-2 py-0.5 text-lg">
              {Math.min(saved.index + 1, saved.deck.length)}/{saved.deck.length}
            </span>
          </Button>
        )}
        <motion.div animate={saved ? {} : { scale: [1, 1.04, 1] }} transition={{ duration: 1.6, repeat: Infinity }}>
          <Button size="xl" className="w-full" onClick={() => (saved ? setConfirmNew(true) : start('classic'))} icon={<Play fill="currentColor" size={34} />}>
            PLAY
          </Button>
        </motion.div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Stats', icon: <BarChart3 size={26} strokeWidth={3} />, to: 'stats' as const },
            { label: 'Settings', icon: <Settings size={26} strokeWidth={3} />, to: 'settings' as const },
            { label: 'How to play', icon: <CircleHelp size={26} strokeWidth={3} />, to: 'howto' as const },
          ].map((b) => (
            <Button key={b.to} variant="dark" className="flex-col !gap-1 !px-1 !py-2 !text-base" onClick={() => go(b.to)}>
              {b.icon}
              {b.label}
            </Button>
          ))}
        </div>
      </div>

      <Modal open={confirmNew} title="Start a new game?" onClose={() => setConfirmNew(false)}>
        <p className="mb-5 font-hand text-2xl text-white/85">You have an unfinished game. Starting a new one will replace it.</p>
        <div className="flex flex-col gap-3">
          <Button variant="white" onClick={() => { setConfirmNew(false); start('classic'); }}>Start new game</Button>
          <Button variant="ghost" onClick={() => setConfirmNew(false)}>Cancel</Button>
        </div>
      </Modal>
    </motion.main>
  );
}
