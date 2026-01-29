'use client';

/**
 * ScrollSection - Igloo-inspired scroll transition wrapper
 *
 * Provides dramatic scroll-driven animations for each section:
 * - Scale & opacity entrance/exit
 * - Chromatic aberration during transitions
 * - Blur/frost effect during movement
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
}

export default function ScrollSection({
  children,
  index,
  bgColor = '#0A0A0A',
  isEdge = false,
}: ScrollSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Smooth spring for butter-smooth animations
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Scale: starts small, grows to 1, then stays
  const scale = useTransform(smoothProgress, [0, 0.3, 0.7, 1], [0.85, 1, 1, 0.95]);

  // Opacity: fades in, stays, fades slightly on exit
  const opacity = useTransform(smoothProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0.3]);

  // Y translation for parallax depth
  const y = useTransform(smoothProgress, [0, 0.3, 0.7, 1], [100, 0, 0, -50]);

  // Blur during transition in/out
  const blurValue = useTransform(smoothProgress, [0, 0.15, 0.85, 1], [8, 0, 0, 4]);
  const filterBlur = useTransform(blurValue, (v) => `blur(${v}px)`);

  // Rotation for subtle 3D feel
  const rotateX = useTransform(smoothProgress, [0, 0.2, 0.8, 1], [3, 0, 0, -2]);

  // Chromatic aberration overlay opacity
  const chromaticOpacity = useTransform(
    smoothProgress,
    [0, 0.1, 0.2, 0.8, 0.9, 1],
    [0.6, 0.3, 0, 0, 0.3, 0.6]
  );

  // Scan line opacity & position
  const scanOpacity = useTransform(
    smoothProgress,
    [0, 0.15, 0.25, 0.75, 0.85, 1],
    [0.4, 0.2, 0, 0, 0.2, 0.4]
  );
  const scanY = useTransform(smoothProgress, [0, 1], ['-100%', '100%']);

  if (isEdge) {
    return (
      <div ref={sectionRef}>
        {children}
      </div>
    );
  }

  return (
    <div ref={sectionRef} className="relative">
      <motion.div
        style={{
          scale,
          opacity,
          y,
          rotateX,
          filter: filterBlur,
          transformPerspective: 1200,
          transformOrigin: 'center center',
        }}
        className="sticky top-0 min-h-screen w-full flex flex-col overflow-hidden rounded-t-[2.5rem] border-t border-white/10"
        data-section-index={index}
      >
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
            <div className="w-full h-px bg-gradient-to-r from-transparent via-[#6691E5]/60 to-transparent shadow-[0_0_20px_rgba(102,145,229,0.5)]" />
          </motion.div>

          {children}
        </div>
      </motion.div>
    </div>
  );
}
