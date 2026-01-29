'use client';

/**
 * Hero Section - Igloo-Inspired with Breathing Centerpiece & Scroll Transition
 *
 * - Single line massive header
 * - Breathing "Shield" centerpiece
 * - Scroll-linked zoom/parallax effects
 */

import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { ChevronDown, Shield, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Geometric Shield Component that "Breathes"
function BreathingCenterpiece({ scrollYProgress }: { scrollYProgress: any }) {
  // Map scroll to scale/opacity
  // Scale UP as we scroll down to create a "portal" effect or just fade out
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 20]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 45]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
      <motion.div
        style={{ scale, opacity, rotate }}
        className="relative"
      >
        {/* Core Shield */}
        <div className="relative w-64 h-64 md:w-96 md:h-96">
          {/* Breathing Animation Layer */}
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-b from-[#6691E5]/20 to-transparent rounded-full blur-xl"
          />

          {/* Geometric Shield Icon */}
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
            </defs>

            {/* Outer Ring */}
            <circle cx="100" cy="100" r="90" fill="none" stroke="url(#borderGrad)" strokeWidth="1" strokeOpacity="0.3" />

            {/* Inner Shield Shape */}
            <path
              d="M100 20 L170 50 V110 C170 155 100 190 100 190 C100 190 30 155 30 110 V50 L100 20 Z"
              fill="url(#shieldGrad)"
              stroke="url(#borderGrad)"
              strokeWidth="2"
            />

            {/* Inner Symbol - "JJ" Monogram or Cross */}
            <path
              d="M100 50 V150 M70 80 H130"
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

  // Track scroll for parallax
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const textY = useTransform(scrollYProgress, [0, 0.5], [0, -200]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative h-[150vh] bg-[#0A0A0A]" // Extra height for scroll distance
    >
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">

        {/* Background Effects */}
        <div className="absolute inset-0 bg-dots opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0A]/50 to-[#0A0A0A] pointer-events-none" />

        {/* Breathing Centerpiece */}
        <BreathingCenterpiece scrollYProgress={scrollYProgress} />

        {/* Content Layer */}
        <motion.div
          style={{ y: textY, opacity: textOpacity }}
          className="relative z-10 w-full px-6 flex flex-col items-center"
        >
          {/* Badge */}
          <div className="mb-12">
            <span className="badge badge-accent text-sm backdrop-blur-md">
              <Sparkles className="w-4 h-4 mr-2" />
              Est. 1994
            </span>
          </div>

          {/* School Name - ONE LINE */}
          <h1 className="w-full text-center mb-8 px-4">
            <span className="font-bambi text-white text-[5vw] leading-none whitespace-nowrap tracking-tight drop-shadow-2xl filter blur-[0.5px]">
              JESUS JUNIOR ACADEMY
            </span>
            {/* Mirror/Reflection Effect */}
            <span
              className="block font-bambi text-white/5 text-[5vw] leading-none whitespace-nowrap tracking-tight transform -scale-y-100 absolute left-0 right-0 top-full origin-top blur-sm select-none"
              aria-hidden="true"
            >
              JESUS JUNIOR ACADEMY
            </span>
          </h1>

          {/* Tagline */}
          <div className="max-w-2xl text-center space-y-6 mt-16 bg-[#0A0A0A]/30 backdrop-blur-sm p-6 rounded-2xl border border-white/5 mx-4">
            <p className="text-2xl md:text-3xl font-medium text-white/90 font-serif">
              The Truth Shall Make You Free
            </p>
            <div className="flex items-center justify-center gap-2 text-white/40 text-sm uppercase tracking-widest">
              <span>Wisdom</span>
              <span className="w-1 h-1 bg-[#6691E5] rounded-full" />
              <span>Character</span>
              <span className="w-1 h-1 bg-[#F5D76E] rounded-full" />
              <span>Service</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-12">
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
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          style={{ opacity: textOpacity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-20"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/30 whitespace-nowrap">Scroll to Explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
