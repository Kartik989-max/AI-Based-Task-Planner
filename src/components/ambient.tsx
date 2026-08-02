"use client";

import { motion } from "framer-motion";

export function AmbientBackground() {
  return (
    <div className="ambient" aria-hidden>
      <div className="ambient-grid" />
      <div className="ambient-noise" />
      <motion.div
        className="shape shape-1"
        animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="shape shape-2"
        animate={{ x: [0, -50, 30, 0], y: [0, 30, -30, 0], rotate: [0, 90, 180, 360] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="shape shape-3"
        animate={{ x: [0, 40, -30, 0], y: [0, 50, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="shape shape-ring"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
