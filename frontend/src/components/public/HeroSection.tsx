'use client';

/**
 * Hero Section - Igloo-Inspired Premium Design
 *
 * Full-screen dark hero with:
 * - Massive typography
 * - Floating glow orbs
 * - Animated dot pattern background
 * - Smooth scroll indicator
 */

import Link from 'next/link';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for parallax effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      mouseX.set(x * 30);
      mouseY.set(y * 30);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <section
      ref={containerRef}
      className="hero-section relative flex flex-col items-center justify-center text-center min-h-screen px-6 overflow-hidden"
    >
      {/* Background layers */}
      <div className="absolute inset-0 bg-dots" />

      {/* Floating glow orbs - parallax effect */}
      <motion.div
        style={{ x: springX, y: springY }}
        className="glow-orb glow-orb-blue w-[400px] h-[400px] -top-20 -left-20 animate-pulse-glow"
      />
      <motion.div
        style={{ x: springX, y: springY }}
        className="glow-orb glow-orb-gold w-[300px] h-[300px] top-1/3 -right-20 animate-pulse-glow"
      />
      <motion.div
        style={{ x: springX, y: springY }}
        className="glow-orb glow-orb-blue w-[250px] h-[250px] bottom-20 left-1/4 animate-pulse-glow"
      />

      {/* Content */}
      <div className="relative z-10 max-w-5xl">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <span className="badge badge-accent text-sm">
            <Sparkles className="w-4 h-4 mr-2" />
            Nurturing Young Minds Since 1994
          </span>
        </motion.div>

        {/* School Name - MASSIVE */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="font-bambi hero-title text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl mb-6 leading-[0.9] tracking-tight"
        >
          <span className="block">JESUS JUNIOR</span>
          <span className="block text-gradient-accent">ACADEMY</span>
        </motion.h1>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-12"
        >
          <p className="text-xl md:text-2xl lg:text-3xl font-medium text-white/90 mb-4">
            "THE TRUTH SHALL MAKE YOU FREE."
          </p>
          <p className="text-base md:text-lg text-white/50 max-w-xl mx-auto">
            Quality Education • Strong Values • Bright Futures
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="#admission">
            <button className="btn btn-gold px-8 py-4 text-lg font-bold">
              Admission Enquiry
            </button>
          </Link>

          <Link href="/login">
            <button className="btn btn-secondary px-8 py-4 text-lg">
              Enter Campus
            </button>
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
      >
        <Link href="#about" className="flex flex-col items-center gap-3 group">
          <span className="text-xs font-medium uppercase tracking-widest text-white/40 group-hover:text-white/60 transition-colors">
            Scroll to explore
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-8 h-12 border border-white/20 rounded-full flex justify-center pt-3 group-hover:border-white/40 transition-colors"
          >
            <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
          </motion.div>
        </Link>
      </motion.div>
    </section>
  );
}
