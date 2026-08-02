"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { pageExit, pageTransition } from "@/components/motion";

export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={reduced ? { opacity: 0 } : pageTransition.initial}
        animate={reduced ? { opacity: 1 } : pageTransition.animate}
        exit={reduced ? { opacity: 0 } : pageExit}
        transition={reduced ? { duration: 0.15 } : pageTransition.transition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
