"use client";

import { motion } from "framer-motion";

export function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  const label = count > 99 ? "99+" : String(count);

  return (
    <motion.span
      className="relative ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-[#ef4444] px-1.5 py-0.5 text-[0.5625rem] font-extrabold leading-none text-white"
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: [1, 1.12, 1],
        opacity: 1,
      }}
      transition={{
        scale: {
          duration: 1.6,
          repeat: Infinity,
          repeatDelay: 1.2,
          ease: "easeInOut",
        },
        opacity: { duration: 0.2 },
      }}
      aria-label={`${count} pending`}
    >
      <motion.span
        className="pointer-events-none absolute inset-0 rounded-full bg-[#ef4444]"
        animate={{ scale: [1, 1.85], opacity: [0.45, 0] }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          repeatDelay: 1.2,
          ease: "easeOut",
        }}
        aria-hidden
      />
      <span className="relative z-1">{label}</span>
    </motion.span>
  );
}
