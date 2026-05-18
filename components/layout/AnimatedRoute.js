"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

const depthOf = (p) => (p ?? "").split("/").filter(Boolean).length;

/**
 * Slide-in transitions between routes, driven by URL depth.
 *  · Drilling deeper (e.g. /vaults → /vaults/[id]) slides in from the right
 *  · Going back slides in from the left
 *  · Switching between same-depth routes (bottom-nav tabs) fades only
 */
export function AnimatedRoute({ children }) {
  const pathname = usePathname();
  const prevRef = useRef({ path: pathname, depth: depthOf(pathname) });

  const curDepth = depthOf(pathname);
  const samePath = prevRef.current.path === pathname;
  const dir = samePath
    ? 0
    : curDepth > prevRef.current.depth
    ? 1
    : curDepth < prevRef.current.depth
    ? -1
    : 0;

  useEffect(() => {
    prevRef.current = { path: pathname, depth: curDepth };
  });

  // Slide distance is intentionally small (24px) so the transition is
  // crisp and doesn't fight with the fixed header / bottom nav.
  const offset = 24;
  const variants = {
    initial: {
      x: dir === 1 ? offset : dir === -1 ? -offset : 0,
      opacity: 0,
    },
    animate: { x: 0, opacity: 1 },
    exit: {
      x: dir === 1 ? -offset : dir === -1 ? offset : 0,
      opacity: 0,
    },
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          duration: dir === 0 ? 0.15 : 0.22,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="will-change-transform"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
