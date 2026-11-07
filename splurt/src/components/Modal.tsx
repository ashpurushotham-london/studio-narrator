import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[2rem] border-[5px] border-white bg-ink p-6 text-center shadow-2xl"
            initial={{ scale: 0.8, y: 30, rotate: -2 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.85, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 24 }}
          >
            <h2 className="mb-3 font-display text-3xl font-bold text-white">{title}</h2>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
