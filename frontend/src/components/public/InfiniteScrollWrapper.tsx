'use client';

/**
 * InfiniteScrollWrapper - Creates an endless scroll loop
 *
 * When the user scrolls past the last section (footer),
 * the page seamlessly transitions back to the top (hero),
 * creating an infinite loop similar to igloo.inc.
 *
 * Technique: We clone the first viewport's worth of content at the bottom.
 * When the user scrolls into the cloned area, we reset scroll position
 * to the matching real content with a crossfade to hide the jump.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';

interface InfiniteScrollWrapperProps {
  children: React.ReactNode;
}

export default function InfiniteScrollWrapper({ children }: InfiniteScrollWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isResettingRef = useRef(false);
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let ticking = false;

    const handleScroll = () => {
      if (ticking || isResettingRef.current) return;
      ticking = true;

      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const scrollBottom = docHeight - scrollTop - winHeight;

        // When user reaches near the bottom (within 50px)
        if (scrollBottom < 50) {
          isResettingRef.current = true;
          setShowFlash(true);

          // Wait for the flash overlay to appear, then reset
          requestAnimationFrame(() => {
            window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });

            // Remove flash after a short delay
            setTimeout(() => {
              setShowFlash(false);
              isResettingRef.current = false;
            }, 600);
          });
        }

        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      {children}

      {/* Transition flash overlay for seamless loop */}
      <motion.div
        initial={false}
        animate={{
          opacity: showFlash ? [0, 1, 1, 0] : 0,
        }}
        transition={{
          duration: 0.6,
          times: [0, 0.15, 0.5, 1],
          ease: 'easeInOut',
        }}
        className="fixed inset-0 z-[9999] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(102,145,229,0.15) 0%, rgba(10,10,10,1) 70%)',
        }}
      />
    </div>
  );
}
