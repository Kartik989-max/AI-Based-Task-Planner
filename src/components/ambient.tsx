"use client";

import { motion } from "framer-motion";

export function AmbientBackground() {
  return (
    <div className="ambient" aria-hidden>
      <div className="ambient-grid" />
      <div className="ambient-noise" />

      <svg className="deco-svg" style={{ top: "12%", left: "8%", width: 180, height: 180 }} viewBox="0 0 180 180">
        <circle className="deco-ring-stroke" cx="90" cy="90" r="70" />
        <circle className="deco-ring-stroke" cx="90" cy="90" r="50" opacity="0.5" />
      </svg>

      <svg className="deco-svg" style={{ bottom: "18%", right: "6%", width: 220, height: 120 }} viewBox="0 0 220 120">
        <path className="deco-line" d="M0 60 Q55 10 110 60 T220 60" />
        <path className="deco-line" d="M0 80 Q55 30 110 80 T220 80" opacity="0.5" />
      </svg>

      <svg className="deco-svg" style={{ top: "55%", left: "2%", width: 100, height: 100 }} viewBox="0 0 100 100">
        <line className="deco-line" x1="10" y1="50" x2="90" y2="50" />
        <line className="deco-line" x1="50" y1="10" x2="50" y2="90" />
      </svg>

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
      <motion.div
        className="shape shape-ring"
        style={{ width: 280, height: 280, top: "8%", right: "12%", opacity: 0.4 }}
        animate={{ rotate: -360, scale: [1, 1.05, 1] }}
        transition={{ rotate: { duration: 55, repeat: Infinity, ease: "linear" }, scale: { duration: 8, repeat: Infinity } }}
      />
    </div>
  );
}
