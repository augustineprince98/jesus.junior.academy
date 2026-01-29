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
  bgColor = '#0A0A0A',
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
    stiffness: 80,
    damping: 25,
    restDelta: 0.0001,
  });

  // === Card Stacking Transforms ===

  // Scale: starts smaller, grows to full size, shrinks slightly on exit
  const scale = useTransform(
    smoothProgress,
    [0, 0.25, 0.5, 0.75, 1],
    [0.88, 0.96, 1, 1, 0.92]
  );

  // Opacity: smooth fade in and out
  const opacity = useTransform(
    smoothProgress,
    [0, 0.15, 0.35, 0.65, 0.85, 1],
    [0, 0.5, 1, 1, 0.8, 0.2]
  );

  // Y translation for parallax depth - bigger movement
  const y = useTransform(
    smoothProgress,
    [0, 0.3, 0.5, 0.7, 1],
    [120, 20, 0, -20, -80]
  );

  // Blur during transition in/out
  const blurValue = useTransform(
    smoothProgress,
    [0, 0.2, 0.35, 0.65, 0.8, 1],
    [12, 4, 0, 0, 4, 10]
  );
  const filterBlur = useTransform(blurValue, (v) => `blur(${v}px)`);

  // Rotation for 3D card tilt effect
  const rotateX = useTransform(
    smoothProgress,
    [0, 0.25, 0.5, 0.75, 1],
    [6, 2, 0, -1, -4]
  );

  // Shadow intensity (increases as section comes into view)
  const shadowOpacity = useTransform(
    smoothProgress,
    [0, 0.3, 0.5, 0.7, 1],
    [0, 0.3, 0.5, 0.3, 0]
  );

  // Border glow intensity
  const borderOpacity = useTransform(
    smoothProgress,
    [0, 0.3, 0.5, 0.7, 1],
    [0.05, 0.15, 0.2, 0.15, 0.05]
  );

  // Chromatic aberration overlay opacity
  const chromaticOpacity = useTransform(
    smoothProgress,
    [0, 0.1, 0.25, 0.75, 0.9, 1],
    [0.8, 0.4, 0, 0, 0.4, 0.8]
  );

  // Scan line opacity & position
  const scanOpacity = useTransform(
    smoothProgress,
    [0, 0.15, 0.3, 0.7, 0.85, 1],
    [0.5, 0.25, 0, 0, 0.25, 0.5]
  );
  const scanY = useTransform(smoothProgress, [0, 1], ['-100%', '200%']);

  // Edge sections (hero/footer) - minimal transforms
  if (isEdge) {
    return (
      <div ref={sectionRef} style={{ zIndex: totalSections - index }}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={sectionRef}
      className="relative"
      style={{ zIndex: totalSections - index + 10 }}
    >
      {/* Shadow beneath card */}
      <motion.div
        style={{ opacity: shadowOpacity }}
        className="absolute inset-x-4 -top-8 h-16 bg-gradient-to-b from-black/80 to-transparent rounded-t-[3rem] blur-2xl pointer-events-none"
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
        className="sticky top-0 min-h-screen w-full flex flex-col overflow-hidden rounded-t-[2.5rem]"
        data-section-index={index}
      >
        {/* Glowing border */}
        <motion.div
          style={{ opacity: borderOpacity }}
          className="absolute inset-0 rounded-t-[2.5rem] pointer-events-none"
        >
          <div className="absolute inset-0 rounded-t-[2.5rem] border-t-2 border-x border-white/20" />
          <div className="absolute -inset-px rounded-t-[2.5rem] bg-gradient-to-b from-white/10 to-transparent blur-sm" />
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
            <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#6691E5]/70 to-transparent shadow-[0_0_30px_rgba(102,145,229,0.6)]" />
          </motion.div>

          {/* Inner glow at top */}
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

          {children}
        </div>
      </motion.div>
    </div>
  );
}

