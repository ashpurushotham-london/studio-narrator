import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import { playSfx } from '../audio/sfx';

type Variant = 'white' | 'dark' | 'ghost' | 'green' | 'red';

const VARIANTS: Record<Variant, string> = {
  white: 'bg-white text-splurt border-white [--btn-shadow:#c90080]',
  dark: 'bg-ink text-white border-white [--btn-shadow:#c90080]',
  ghost: 'bg-white/15 text-white border-white/70 [--btn-shadow:rgba(0,0,0,0.25)]',
  green: 'bg-correct text-ink border-white [--btn-shadow:#0c8a57]',
  red: 'bg-wrong text-white border-white [--btn-shadow:#a31c2c]',
};

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  size?: 'md' | 'lg' | 'xl';
  icon?: ReactNode;
  children?: ReactNode;
  silent?: boolean;
}

const SIZES = {
  md: 'min-h-12 px-5 text-xl rounded-2xl border-[3px]',
  lg: 'min-h-14 px-7 text-2xl rounded-3xl border-4',
  xl: 'min-h-20 px-10 text-4xl rounded-[2rem] border-[5px]',
};

export function Button({ variant = 'white', size = 'md', icon, children, className = '', onClick, silent, ...rest }: ButtonProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      className={`btn-chunky inline-flex cursor-pointer items-center justify-center gap-3 font-display font-bold tracking-wide ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      onClick={(e) => {
        if (!silent) playSfx('tap');
        onClick?.(e);
      }}
      {...rest}
    >
      {icon}
      {children}
    </motion.button>
  );
}
