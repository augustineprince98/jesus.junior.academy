'use client';

/**
 * Hero Section - Igloo.inc Inspired
 *
 * Full-viewport immersive hero with:
 * - Particle field background (canvas)
 * - Text scramble/reveal animation on load
 * - Scroll-driven zoom-out + chromatic aberration
 * - Breathing geometric centerpiece
 * - Smooth parallax content layers
 */

import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ParticleField from './ParticleField';

// Clean fade-in animation (minimalist approach)

// Breathing shield centerpiece
function BreathingCenterpiece({ scrollYProgress }: { scrollYProgress: any }) {
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 25]);
  const opacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 90]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
      <motion.div style={{ scale, opacity, rotate }} className="relative">
        <div className="relative w-64 h-64 md:w-96 md:h-96">
          {/* Breathing pulse */}
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 bg-gradient-to-b from-[#6691E5]/20 to-transparent rounded-full blur-2xl"
          />

          {/* Secondary pulse - gold */}
          <motion.div
            animate={{ scale: [1.05, 1, 1.05], opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute inset-0 bg-gradient-to-t from-[#F5D76E]/15 to-transparent rounded-full blur-3xl"
          />

          {/* Shield SVG */}
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#222" />
                <stop offset="50%" stopColor="#111" />
                <stop offset="100%" stopColor="#000" />
              </linearGradient>
              <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6691E5" />
                <stop offset="100%" stopColor="#F5D76E" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Outer rings - enlarged to center shield properly */}
            <circle cx="100" cy="100" r="98" fill="none" stroke="url(#borderGrad)" strokeWidth="0.5" strokeOpacity="0.15" />
            <circle cx="100" cy="100" r="94" fill="none" stroke="url(#borderGrad)" strokeWidth="1" strokeOpacity="0.3" />

            {/* Shield shape */}
            <path
              d="M100 15 L170 45 V105 C170 150 100 185 100 185 C100 185 30 150 30 105 V45 L100 15 Z"
              fill="url(#shieldGrad)"
              stroke="url(#borderGrad)"
              strokeWidth="2"
              filter="url(#glow)"
            />

            {/* Cross symbol */}
            <path
              d="M100 45 V145 M70 75 H130"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.8"
            />
          </svg>
        </div>
      </motion.div>
    </div>
  );
}

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Parallax transforms
  const textY = useTransform(smoothScroll, [0, 0.5], [0, -250]);
  const textOpacity = useTransform(smoothScroll, [0, 0.35], [1, 0]);
  const textScale = useTransform(smoothScroll, [0, 0.5], [1, 0.8]);

  // Chromatic aberration intensity on scroll
  const chromaticIntensity = useTransform(smoothScroll, [0, 0.1, 0.4], [0, 0.5, 1]);

  // Background zoom
  const bgScale = useTransform(smoothScroll, [0, 0.5], [1, 1.15]);

  // Static text (clean, no scramble)
  const schoolName = 'JESUS JUNIOR ACADEMY';
  const tagline = 'The Truth Shall Make You Free';

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative h-[200vh] bg-[#0A0A0A]"
    >
      <motion.div
        style={{ scale: bgScale }}
        className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Particle Field Background */}
        <ParticleField />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-dots opacity-30 z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0A]/30 to-[#0A0A0A] pointer-events-none z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-[#0A0A0A]/50 pointer-events-none z-[1]" />

        {/* Chromatic aberration overlay on scroll */}
        <motion.div
          style={{ opacity: chromaticIntensity }}
          className="absolute inset-0 pointer-events-none z-[2] chromatic-hero-scroll"
        />

        {/* Breathing Centerpiece */}
        <BreathingCenterpiece scrollYProgress={smoothScroll} />

        {/* Content Layer */}
        <motion.div
          style={{ y: textY, opacity: textOpacity, scale: textScale }}
          className="relative z-10 w-full px-6 flex flex-col items-center"
        >
          {/* Badge - fade in */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-12"
          >
            <span className="badge badge-accent text-sm backdrop-blur-md">
              <Sparkles className="w-4 h-4 mr-2" />
              Est. 1994
            </span>
          </motion.div>

          {/* School Name - Elegant Letter Reveal Animation */}
          <div className="w-full text-center mb-8 px-4 relative overflow-hidden">
            <h1 className="flex justify-center items-center flex-wrap gap-x-[0.15em]">
              {schoolName.split('').map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
                  animate={isLoaded ? {
                    opacity: 1,
                    y: 0,
                    filter: 'blur(0px)',
                  } : {}}
                  transition={{
                    duration: 0.6,
                    delay: 0.4 + (i * 0.04),
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={`font-bambi text-white text-[5vw] leading-none tracking-tight inline-block ${char === ' ' ? 'w-[0.3em]' : ''
                    }`}
                  style={{
                    textShadow: '0 0 40px rgba(102, 145, 229, 0.3), 0 0 80px rgba(245, 215, 110, 0.15)'
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </h1>

            {/* Elegant underline reveal */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={isLoaded ? { scaleX: 1, opacity: 1 } : {}}
              transition={{
                duration: 1.2,
                delay: 0.8 + schoolName.length * 0.04,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="h-[2px] w-48 mx-auto mt-6 bg-gradient-to-r from-transparent via-white/40 to-transparent origin-center"
            />
          </div>

          {/* Tagline with scramble */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="max-w-2xl text-center space-y-6 mt-16 bg-[#0A0A0A]/30 backdrop-blur-sm p-6 rounded-2xl border border-white/5 mx-4"
          >
            <p className="text-2xl md:text-3xl font-medium text-white/90 font-serif">
              {tagline}
            </p>
            <div className="flex items-center justify-center gap-2 text-white/40 text-sm uppercase tracking-widest">
              <motion.span
                initial={{ opacity: 0 }}
                animate={isLoaded ? { opacity: 1 } : {}}
                transition={{ delay: 1.8 }}
              >
                Wisdom
              </motion.span>
              <motion.span
                initial={{ scale: 0 }}
                animate={isLoaded ? { scale: 1 } : {}}
                transition={{ delay: 2.0, type: 'spring' }}
                className="w-1.5 h-1.5 bg-[#6691E5] rounded-full"
              />
              <motion.span
                initial={{ opacity: 0 }}
                animate={isLoaded ? { opacity: 1 } : {}}
                transition={{ delay: 2.2 }}
              >
                Character
              </motion.span>
              <motion.span
                initial={{ scale: 0 }}
                animate={isLoaded ? { scale: 1 } : {}}
                transition={{ delay: 2.4, type: 'spring' }}
                className="w-1.5 h-1.5 bg-[#F5D76E] rounded-full"
              />
              <motion.span
                initial={{ opacity: 0 }}
                animate={isLoaded ? { opacity: 1 } : {}}
                transition={{ delay: 2.6 }}
              >
                Service
              </motion.span>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 1.8 }}
            className="flex flex-col sm:flex-row gap-4 mt-12"
          >
            <Link href="#admission">
              <button className="btn btn-gold px-8 py-4 text-lg font-bold min-w-[200px]">
                Admission Enquiry
              </button>
            </Link>
            <Link href="/login">
              <button className="btn btn-secondary px-8 py-4 text-lg min-w-[200px] hover:bg-white/5">
                Digital Campus
              </button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          style={{ opacity: textOpacity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-20"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={isLoaded ? { opacity: 1 } : {}}
            transition={{ delay: 2.5 }}
            className="text-[10px] uppercase tracking-[0.3em] text-white/30 whitespace-nowrap"
          >
            Scroll to Explore
          </motion.span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
