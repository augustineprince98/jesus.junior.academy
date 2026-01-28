'use client';

/**
 * Hero Section - Premium Top Fold
 *
 * Clean, centered design with school name and tagline.
 * Features subtle animations and premium button styles.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronDown, GraduationCap, Users } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="hero-section relative flex flex-col items-center justify-center text-center py-24 md:py-32 px-4 min-h-[90vh]">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 bg-hero-pattern bg-[length:40px_40px] opacity-50" />

      {/* Content */}
      <div className="relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-900 rounded-full text-sm font-semibold">
            <GraduationCap className="w-4 h-4" />
            Nurturing Young Minds Since 1994
          </span>
        </motion.div>

        {/* School Name - Bambi Bold Font, All Caps */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-bambi hero-title text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-6 leading-tight tracking-tight"
        >
          JESUS JUNIOR
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> </span>
          ACADEMY
        </motion.h1>

        {/* Tagline - Nunito Font */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl lg:text-2xl font-medium text-gray-600 mb-12 max-w-2xl mx-auto"
        >
          <span className="text-blue-900 font-semibold">"THE TRUTH SHALL MAKE YOU FREE."</span>
          <br />
          <span className="text-base md:text-lg text-gray-500 mt-2 block">
            Quality Education • Strong Values • Bright Futures
          </span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="#admission">
            <button className="btn btn-primary px-8 py-4 text-lg flex items-center gap-2 group">
              <Users className="w-5 h-5" />
              Admission Enquiry
              <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </Link>

          <Link href="/login">
            <button className="btn btn-secondary px-8 py-4 text-lg">
              Login to Campus
            </button>
          </Link>
        </motion.div>


      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-400"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider">Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-gray-400 rounded-full"
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
