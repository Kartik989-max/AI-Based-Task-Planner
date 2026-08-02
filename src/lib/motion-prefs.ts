"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export function useFinePointer() {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return fine;
}

export function useMotionEffects() {
  const reduced = !!useReducedMotion();
  const fine = useFinePointer();
  return { reduced, fine };
}
