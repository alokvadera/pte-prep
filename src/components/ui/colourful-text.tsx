"use client";
import React from "react";
import { motion } from "motion/react";
import { prefersReducedMotion } from '../../lib/motion'

/* The palette is a module constant, not a value the component derives:
   reading it from inside the effect would make it a dependency, and a
   new array on every render would restart the interval each time. */
const COLORS = [
  'rgb(46, 184, 138)', // candy mint
  'rgb(139, 92, 246)', // brand violet
  'rgb(245, 158, 11)',  // warm amber
  'rgb(255, 126, 182)', // radiant rose
  'rgb(91, 84, 168)',   // brand indigo
  'rgb(14, 165, 233)',  // vivid sky
  'rgb(234, 88, 12)',   // bright orange
  'rgb(168, 85, 247)',  // electric purple
  'rgb(16, 185, 129)',  // mint green
  'rgb(244, 63, 94)',   // coral rose
];

export default function ColourfulText({ text }: { text: string }) {
  const [currentColors, setCurrentColors] = React.useState(COLORS);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    // A word that reshuffles, bounces and blurs every five seconds is
    // exactly the motion this visitor asked not to receive. The text
    // keeps its colours; only the choreography stops.
    if (prefersReducedMotion()) return;

    const interval = setInterval(() => {
      const shuffled = [...COLORS].sort(() => Math.random() - 0.5);
      setCurrentColors(shuffled);
      setCount((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return text.split("").map((char, index) => (
    <motion.span
      key={`${char}-${count}-${index}`}
      initial={{
        y: 0,
      }}
      animate={{
        color: currentColors[index % currentColors.length],
        y: [0, -2.5, 0],
        scale: [1, 1.01, 1],
        filter: ["blur(0px)", "blur(2.5px)", "blur(0px)"],
        opacity: [1, 0.85, 1],
      }}
      transition={{
        duration: 0.45,
        delay: index * 0.04,
      }}
      className="inline-block whitespace-pre font-sans tracking-tight"
    >
      {char}
    </motion.span>
  ));
}
