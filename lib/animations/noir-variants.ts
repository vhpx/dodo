import { Variants } from "framer-motion";

// Slow, deliberate fade for building tension
export const fadeInSlow: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 1.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.6, ease: "easeIn" },
  },
};

// Spotlight reveal effect - emerging from darkness
export const spotlightReveal: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    filter: "brightness(0.5)",
  },
  animate: {
    opacity: 1,
    scale: 1,
    filter: "brightness(1)",
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    filter: "brightness(0.5)",
    transition: { duration: 0.4 },
  },
};

// Subtle breathing animation for tension
export const breathe: Variants = {
  animate: {
    opacity: [0.7, 1, 0.7],
    scale: [1, 1.02, 1],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Light flicker effect for unstable lights
export const flicker: Variants = {
  animate: {
    opacity: [1, 0.8, 1, 0.9, 1, 0.85, 1],
    transition: {
      duration: 0.3,
      repeat: Infinity,
      repeatDelay: 5,
    },
  },
};

// Slow pulse for critical/danger elements
export const tensePulse: Variants = {
  animate: {
    boxShadow: [
      "0 0 20px oklch(0.45 0.20 25 / 0.2)",
      "0 0 40px oklch(0.45 0.20 25 / 0.4)",
      "0 0 20px oklch(0.45 0.20 25 / 0.2)",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Gold pulse for highlighted elements
export const goldPulse: Variants = {
  animate: {
    boxShadow: [
      "0 0 15px oklch(0.75 0.15 70 / 0.2)",
      "0 0 30px oklch(0.75 0.15 70 / 0.4)",
      "0 0 15px oklch(0.75 0.15 70 / 0.2)",
    ],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Stagger container for dramatic reveals
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

// Stagger item - child of stagger container
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

// Slide in from shadow (left)
export const slideFromShadow: Variants = {
  initial: { opacity: 0, x: -30 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    x: -30,
    transition: { duration: 0.4 },
  },
};

// Emerge from below (for modals, cards)
export const emergeFromBelow: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: 0.3 },
  },
};

// Stamp effect (for "CASE CLOSED" etc)
export const stampEffect: Variants = {
  initial: {
    opacity: 0,
    scale: 2,
    rotate: -15,
  },
  animate: {
    opacity: 1,
    scale: 1,
    rotate: -5,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// Typewriter text reveal
export const typewriterContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.03,
    },
  },
};

export const typewriterChar: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0 },
  },
};
