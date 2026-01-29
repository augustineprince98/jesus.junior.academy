'use client';

/**
 * InfiniteScrollWrapper - Seamless Endless Scroll Loop
 *
 * When the user scrolls past the last section (footer),
 * the page seamlessly transitions back to the top (hero),
 * creating an infinite loop similar to igloo.inc.
 *
 * IMPROVED: Much smoother transition using:
 * - Quick zoom-blur effect
 * - Minimal overlay duration
 * - Faster scroll reset
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface InfiniteScrollWrapperProps {
  children: React.ReactNode;
}

export default function InfiniteScrollWrapper({ children }: InfiniteScrollWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isResettingRef = useRef(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

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
        if (scrollBottom < 50 && !isResettingRef.current) {
          isResettingRef.current = true;
          setIsTransitioning(true);

          // Quick transition: fade in overlay, reset, fade out
          setTimeout(() => {
            // Reset scroll position while overlay is visible
            window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });

            // Start fading out
            setTimeout(() => {
              setIsTransitioning(false);

              // Allow next trigger after animation completes
              setTimeout(() => {
                isResettingRef.current = false;
              }, 300);
            }, 150);
          }, 200);
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

      {/* Smooth transition overlay */}
      <motion.div
        initial={false}
        animate={{
          opacity: isTransitioning ? 1 : 0,
          scale: isTransitioning ? 1.02 : 1,
        }}
        transition={{
          duration: isTransitioning ? 0.2 : 0.35,
          ease: 'easeOut',
        }}
        className="fixed inset-0 z-[9999] pointer-events-none"
        style={{
          background: '#0A0A0A',
        }}
      >
        {/* Subtle center glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{
              opacity: isTransitioning ? 0.4 : 0,
              scale: isTransitioning ? 1.2 : 0.8,
            }}
            transition={{ duration: 0.3 }}
            className="w-64 h-64 rounded-full bg-gradient-to-br from-[#6691E5]/30 to-[#F5D76E]/20 blur-[60px]"
          />
        </div>
      </motion.div>
    </div>
  );
}
