'use client';

/**
 * InfiniteScrollWrapper - Seamless Endless Scroll Loop
 *
 * When the user scrolls past the last section (footer),
 * the page seamlessly transitions back to the top (hero),
 * creating an infinite loop similar to igloo.inc.
 *
 * Technique:
 * - Detect when user reaches near bottom
 * - Apply a smooth crossfade overlay
 * - Reset scroll position during fade
 * - Remove overlay to reveal hero
 *
 * Enhanced version with smoother transitions and no jarring flash.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InfiniteScrollWrapperProps {
  children: React.ReactNode;
}

export default function InfiniteScrollWrapper({ children }: InfiniteScrollWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isResettingRef = useRef(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'fadeOut' | 'reset' | 'fadeIn'>('idle');

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

        // When user reaches near the bottom (within 100px)
        if (scrollBottom < 100 && !isResettingRef.current) {
          isResettingRef.current = true;
          setIsTransitioning(true);
          setTransitionPhase('fadeOut');

          // Phase 1: Fade to overlay (300ms)
          setTimeout(() => {
            setTransitionPhase('reset');

            // Phase 2: Reset scroll position while overlay is opaque
            requestAnimationFrame(() => {
              window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });

              // Phase 3: Start fade in (after scroll reset)
              setTimeout(() => {
                setTransitionPhase('fadeIn');

                // Phase 4: Complete transition
                setTimeout(() => {
                  setTransitionPhase('idle');
                  setIsTransitioning(false);
                  isResettingRef.current = false;
                }, 500);
              }, 100);
            });
          }, 400);
        }

        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate overlay opacity based on phase
  const getOverlayOpacity = () => {
    switch (transitionPhase) {
      case 'fadeOut':
        return 1;
      case 'reset':
        return 1;
      case 'fadeIn':
        return 0;
      default:
        return 0;
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      {children}

      {/* Smooth crossfade overlay for seamless loop */}
      <motion.div
        initial={false}
        animate={{
          opacity: getOverlayOpacity(),
        }}
        transition={{
          duration: transitionPhase === 'fadeOut' ? 0.4 : transitionPhase === 'fadeIn' ? 0.5 : 0,
          ease: 'easeInOut',
        }}
        className="fixed inset-0 z-[9999] pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at center, rgba(102,145,229,0.08) 0%, rgba(10,10,10,1) 50%),
            linear-gradient(to bottom, #0A0A0A, #0A0A0A)
          `,
        }}
      >
        {/* Central glow during transition */}
        <motion.div
          animate={{
            scale: transitionPhase === 'reset' ? [1, 1.5, 1] : 1,
            opacity: transitionPhase === 'reset' ? [0.3, 0.6, 0.3] : 0,
          }}
          transition={{ duration: 0.6 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-br from-[#6691E5]/20 to-[#F5D76E]/10 blur-[80px]"
        />

        {/* Animated lines during transition */}
        {transitionPhase !== 'idle' && (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: '-100%', opacity: 0 }}
                animate={{
                  x: transitionPhase === 'reset' ? '200%' : '-100%',
                  opacity: transitionPhase === 'reset' ? [0, 0.5, 0] : 0,
                }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.1,
                  ease: 'easeInOut',
                }}
                className="absolute h-px bg-gradient-to-r from-transparent via-[#6691E5]/50 to-transparent"
                style={{ top: `${20 + i * 15}%` }}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Scroll progress indicator at bottom */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 opacity-0 hover:opacity-100 transition-opacity">
        <div className="text-[10px] text-white/30 uppercase tracking-widest">
          Scroll to continue
        </div>
      </div>
    </div>
  );
}

