import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useApp, type ScreenId } from '../state/AppContext';
import { playSfx } from '../audio/sfx';

interface ScreenProps {
  title?: string;
  back?: ScreenId;
  children: ReactNode;
  right?: ReactNode;
}

/** Shared frame for the menu-style screens: pink background, scrolling body, optional header. */
export function Screen({ title, back, children, right }: ScreenProps) {
  const { go } = useApp();
  return (
    <motion.main
      className="splurt-bg flex h-dvh flex-col overflow-hidden"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {title && (
        <header className="pt-safe mx-auto flex w-full max-w-3xl items-center gap-3 px-4 pb-2">
          {back && (
            <motion.button
              aria-label="Back"
              whileTap={{ scale: 0.88 }}
              className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-full border-[3px] border-white bg-white/15"
              onClick={() => {
                playSfx('tap');
                go(back);
              }}
            >
              <ArrowLeft size={26} strokeWidth={3} />
            </motion.button>
          )}
          <h1 className="flex-1 font-display text-4xl font-bold drop-shadow-[0_3px_0_#c90080]">{title}</h1>
          {right}
        </header>
      )}
      <div className="pb-safe mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 pt-2">{children}</div>
    </motion.main>
  );
}
