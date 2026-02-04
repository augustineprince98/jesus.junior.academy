'use client';

/**
 * ScrollSection - Igloo.inc-inspired Card-Stacking Scroll Wrapper
 *
 * Provides dramatic scroll-driven animations for each section:
 * - True card-stacking effect (sections stack on top of each other)
 * - Scale & opacity entrance/exit with smooth springs
 * - Chromatic aberration during transitions
 * - Blur/frost effect during movement
 * - Shadow beneath incoming sections
 * - Parallax depth effect
 *
 * FIXED: Eliminated gaps between sections by:
 * - Starting opacity at 0.8 instead of 0
 * - Reducing Y translation range
 * - Adding negative top margin for overlap
 */

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

interface ScrollSectionProps {
  children: React.ReactNode;
  index: number;
  bgColor?: string;
  /** If true, section uses full height with no rounded corners (for hero/footer) */
  isEdge?: boolean;
  /** Total number of sections for z-index calculation */
  totalSections?: number;
}

export default function ScrollSection({
  children,
  index,
  bgColor = 'var(--bg-primary)',
  isEdge = false,
  totalSections = 7,
}: ScrollSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Smoother spring for butter-smooth animations
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // === Card Stacking Transforms (Optimized for no gaps) ===

  // Scale: starts at 0.95, grows to full size, shrinks slightly on exit
  // === Slider Transitions ===

  // Y parallax - Current section moves slightly slower than scroll to create depth
  const y = useTransform(smoothProgress, [0, 1], [0, 50]);

  // Edge sections (hero/footer) - minimal transforms but with proper background
  if (isEdge) {
    return (
      <div
        ref={sectionRef}
        className="relative"
        style={{
          zIndex: totalSections - index,
          background: bgColor,
          scrollSnapAlign: 'start',
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={sectionRef}
      className="relative"
      style={{
        zIndex: 1,
        scrollSnapAlign: 'start',
        minHeight: '100vh',
      }}
    >


      <motion.div
        style={{
          // Removed scale/opacity/rotate for solid slider effect
          // Only keep parallax if needed, or minimal transforms
          y, // Keep slight parallax if desired, or remove for pure static stickiness
        }}
        className="sticky top-0 min-h-screen w-full flex flex-col overflow-hidden"
        data-section-index={index}
      >
        {/* Border removed for seamless look */}

        <div
          className="min-h-screen flex flex-col justify-center relative"
          style={{ background: bgColor }}
        >
          {/* Inner glow at top for depth separation */}
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/5 to-transparent pointer-events-none" />

          {children}
        </div>
      </motion.div>
    </div >
  );
}
