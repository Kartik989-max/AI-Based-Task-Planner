"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

const ease = "easeOut" as const;

export const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.2, ease },
};

type MotionProps = HTMLMotionProps<"div"> & { children: ReactNode };

export function FadeIn({ children, className, ...props }: MotionProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.2, ease }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
