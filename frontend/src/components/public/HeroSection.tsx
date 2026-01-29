'use client';

/**
 * Hero Section - Igloo.inc Inspired with Interactive Parallax
 *
 * Full-screen dark hero with:
 * - Interactive dot grid that reacts to mouse
 * - Parallax floating elements
 * - Smooth animations
 */

import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';

// Interactive dot grid component
function InteractiveDotGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseenter', () => setIsHovering(true));
    container.addEventListener('mouseleave', () => setIsHovering(false));

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseenter', () => setIsHovering(true));
      container.removeEventListener('mouseleave', () => setIsHovering(false));
    };
  }, [handleMouseMove]);

  // Generate dots
  const dots = [];
  const spacing = 50;
  const cols = 40;
  const rows = 25;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const x = j * spacing + spacing / 2;
      const y = i * spacing + spacing / 2;

      // Calculate distance from mouse
      const dx = mousePosition.x - x;
      const dy = mousePosition.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = 150;

      // Calculate displacement based on distance
      const factor = Math.max(0, 1 - distance / maxDistance);
      const displaceX = isHovering ? (dx / distance) * factor * 20 : 0;
      const displaceY = isHovering ? (dy / distance) * factor * 20 : 0;

      // Calculate opacity based on distance
      const opacity = isHovering && distance < maxDistance
        ? 0.15 + factor * 0.6
        : 0.08;

      dots.push(
        <circle
          key={`${i}-${j}`}
          cx={x + (isNaN(displaceX) ? 0 : displaceX)}
          cy={y + (isNaN(displaceY) ? 0 : displaceY)}
          r={isHovering && distance < maxDistance ? 2 + factor * 2 : 1.5}
          fill={distance < maxDistance && isHovering ? '#6691E5' : '#ffffff'}
          opacity={opacity}
          style={{
            transition: 'all 0.15s ease-out',
          }}
        />
      );
    }
  }

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <svg
        className="w-full h-full"
        style={{ minWidth: cols * spacing, minHeight: rows * spacing }}
      >
        {dots}
      </svg>
    </div>
  );
}

// Floating parallax element
function FloatingElement({
  children,
  depth = 1,
  className = ''
}: {
  children: React.ReactNode;
  depth?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 50, damping: 20 };
  const x = useSpring(useTransform(mouseX, [-500, 500], [-30 * depth, 30 * depth]), springConfig);
  const y = useSpring(useTransform(mouseY, [-500, 500], [-30 * depth, 30 * depth]), springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      mouseX.set(e.clientX - centerX);
      mouseY.set(e.clientY - centerY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div ref={ref} style={{ x, y }} className={className}>
      {children}
    </motion.div>
  );
}

export default function HeroSection() {
  return (
    <section className="hero-section relative flex flex-col items-center justify-center text-center min-h-screen px-6 overflow-hidden bg-[#0A0A0A]">
      {/* Interactive dot grid background */}
      <InteractiveDotGrid />

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0A0A0A] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#0A0A0A_70%)] pointer-events-none" />

      {/* Floating glow orbs with parallax */}
      <FloatingElement depth={0.5} className="absolute">
        <div className="glow-orb glow-orb-blue w-[500px] h-[500px] -top-40 -left-40 animate-pulse-glow" />
      </FloatingElement>

      <FloatingElement depth={0.8} className="absolute">
        <div className="glow-orb glow-orb-gold w-[350px] h-[350px] top-1/4 -right-32 animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </FloatingElement>

      <FloatingElement depth={0.3} className="absolute">
        <div className="glow-orb glow-orb-blue w-[200px] h-[200px] bottom-32 left-1/4 animate-pulse-glow" style={{ animationDelay: '2s' }} />
      </FloatingElement>

      {/* Content with parallax */}
      <div className="relative z-10 max-w-5xl">
        {/* Badge */}
        <FloatingElement depth={0.2}>
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
        </FloatingElement>

        {/* School Name - MASSIVE with parallax layers */}
        <div className="relative">
          {/* Shadow/depth layer */}
          <FloatingElement depth={0.1}>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="font-bambi text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl leading-[0.9] tracking-tight text-white/10 absolute inset-0 blur-sm select-none"
              aria-hidden="true"
            >
              <span className="block">JESUS JUNIOR</span>
              <span className="block">ACADEMY</span>
            </motion.h1>
          </FloatingElement>

          {/* Main text */}
          <FloatingElement depth={0.3}>
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="font-bambi hero-title text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl mb-6 leading-[0.9] tracking-tight relative"
            >
              <span className="block text-white">JESUS JUNIOR</span>
              <span className="block text-gradient-accent">ACADEMY</span>
            </motion.h1>
          </FloatingElement>
        </div>

        {/* Tagline */}
        <FloatingElement depth={0.4}>
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
        </FloatingElement>

        {/* CTA Buttons */}
        <FloatingElement depth={0.5}>
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
        </FloatingElement>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10"
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

      {/* Decorative lines */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </section>
  );
}
