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
  const scale = useTransform(
    smoothProgress,
    [0, 0.2, 0.4, 0.6, 1],
    [0.92, 0.98, 1, 1, 0.96]
  );

  // Opacity: Start more visible to avoid blank gaps
  const opacity = useTransform(
    smoothProgress,
    [0, 0.1, 0.3, 0.7, 0.9, 1],
    [0.6, 0.85, 1, 1, 0.9, 0.4]
  );

  // Y translation - reduced range to prevent gaps
  const y = useTransform(
    smoothProgress,
    [0, 0.2, 0.4, 0.6, 1],
    [60, 15, 0, 0, -30]
  );

  // Blur during transition - reduced intensity
  const blurValue = useTransform(
    smoothProgress,
    [0, 0.15, 0.3, 0.7, 0.85, 1],
    [4, 1, 0, 0, 1, 3]
  );
  const filterBlur = useTransform(blurValue, (v) => `blur(${v}px)`);

  // Rotation for 3D card tilt effect - subtle
  const rotateX = useTransform(
    smoothProgress,
    [0, 0.2, 0.5, 0.8, 1],
    [2, 0.5, 0, -0.5, -1]
  );

  // Shadow intensity (increases as section comes into view)
  const shadowOpacity = useTransform(
    smoothProgress,
    [0, 0.3, 0.5, 0.7, 1],
    [0.2, 0.4, 0.5, 0.4, 0.2]
  );

  // Border glow intensity
  const borderOpacity = useTransform(
    smoothProgress,
    [0, 0.3, 0.5, 0.7, 1],
    [0.1, 0.2, 0.25, 0.2, 0.1]
  );

  // Chromatic aberration overlay opacity - reduced
  const chromaticOpacity = useTransform(
    smoothProgress,
    [0, 0.1, 0.2, 0.8, 0.9, 1],
    [0.3, 0.15, 0, 0, 0.15, 0.3]
  );

  // Scan line opacity & position
  const scanOpacity = useTransform(
    smoothProgress,
    [0, 0.15, 0.25, 0.75, 0.85, 1],
    [0.3, 0.15, 0, 0, 0.15, 0.3]
  );
  const scanY = useTransform(smoothProgress, [0, 1], ['-50%', '150%']);

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
        zIndex: totalSections - index + 10,
        marginTop: index === 1 ? '-2rem' : '-4rem', // Overlap sections
        scrollSnapAlign: 'start',
      }}
    >
      {/* Shadow beneath card */}
      <motion.div
        style={{ opacity: shadowOpacity }}
        className="absolute inset-x-0 -top-6 h-12 bg-gradient-to-b from-black/60 to-transparent blur-xl pointer-events-none"
      />

      <motion.div
        style={{
          scale,
          opacity,
          y,
          rotateX,
          filter: filterBlur,
          transformPerspective: 1500,
          transformOrigin: 'center top',
        }}
        className="sticky top-0 min-h-screen w-full flex flex-col overflow-hidden rounded-t-[2rem]"
        data-section-index={index}
      >
        {/* Glowing border */}
        <motion.div
          style={{ opacity: borderOpacity }}
          className="absolute inset-0 rounded-t-[2rem] pointer-events-none z-10"
        >
          <div className="absolute inset-0 rounded-t-[2rem] border-t-2 border-x border-[var(--glass-border)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--glass-highlight)] to-transparent" />
        </motion.div>

        <div
          className="min-h-screen flex flex-col justify-center relative"
          style={{ background: bgColor }}
        >
          {/* Chromatic aberration overlay - appears during transitions */}
          <motion.div
            style={{ opacity: chromaticOpacity }}
            className="absolute inset-0 pointer-events-none z-50 chromatic-aberration-overlay"
          />

          {/* Scan line effect during scroll */}
          <motion.div
            style={{ opacity: scanOpacity, y: scanY }}
            className="absolute inset-0 pointer-events-none z-50"
            aria-hidden
          >
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--accent-blue)]/50 to-transparent shadow-[0_0_20px_var(--accent-blue-glow)]" />
          </motion.div>

          {/* Inner glow at top */}
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[var(--text-primary)]/[0.02] to-transparent pointer-events-none" />

          {children}
        </div>
      </motion.div>
    </div>
  );
}
