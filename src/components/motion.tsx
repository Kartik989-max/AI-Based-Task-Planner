"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

export const page = {
  initial: { opacity: 0, y: 24, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.55, ease },
};

export const stagger = {
  animate: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

export const child = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease } },
};

type MotionProps = HTMLMotionProps<"div"> & { children: ReactNode };

export function FadeIn({ children, className, ...props }: MotionProps) {
  return (
    <motion.div initial={page.initial} animate={page.animate} transition={page.transition} className={className} {...props}>
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className={className}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={child} className={className}>
      {children}
    </motion.div>
  );
}

export function Float({ children, className }: { children: ReactNode; className?: string }) {
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
