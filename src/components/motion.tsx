"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

export const page = {
  initial: { opacity: 0, y: 24, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.55, ease },
};

export const pageTransition = {
  initial: { opacity: 0, y: 28, scale: 0.985, filter: "blur(10px)" },
  animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  transition: { duration: 0.5, ease },
};

export const pageExit = {
  opacity: 0,
  y: -16,
  scale: 0.99,
  filter: "blur(6px)",
  transition: { duration: 0.3, ease },
};

export const stagger = {
  animate: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

export const child = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease } },
};

export const reveal = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease } },
};

type MotionProps = HTMLMotionProps<"div"> & { children: ReactNode };

export function FadeIn({ children, className, ...props }: MotionProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : page.initial}
      animate={reduced ? { opacity: 1 } : page.animate}
      transition={reduced ? { duration: 0.15 } : page.transition}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className={className}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div variants={child} className={className}>
      {children}
    </motion.div>
  );
}

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={reveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

export function Float({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

export function Marquee({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`marquee-wrap ${className}`.trim()} aria-hidden>
      <div className="marquee-track">
        <span className="marquee-content">{children}</span>
        <span className="marquee-content">{children}</span>
      </div>
    </div>
  );
}
