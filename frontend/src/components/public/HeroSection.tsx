'use client';

/**
 * Hero Section - Top Fold
 *
 * Clean, centered design with school name and tagline.
 * School name uses Bambi font (all caps), other text uses Nunito.
 */

import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center text-center py-20 md:py-28 bg-white px-4">
      {/* School Name - Bambi Bold Font, All Caps */}
      <h1 className="font-bambi text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-blue-900 mb-6 leading-tight">
        JESUS JUNIOR<br className="sm:hidden" /> ACADEMY
      </h1>

      {/* Tagline - Nunito Font */}
      <p className="text-lg md:text-xl font-semibold text-gray-700 mb-10">
        "THE TRUTH SHALL MAKE YOU FREE."
      </p>

      {/* CTA Buttons - Nunito Font */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link href="#admission">
          <button className="px-8 py-3 bg-blue-900 text-white font-semibold text-lg rounded-lg shadow-md hover:bg-blue-800 hover:shadow-lg transition-all duration-300">
            Admission Enquiry
          </button>
        </Link>

        <Link href="/login">
          <button className="px-8 py-3 bg-white border-2 border-blue-900 text-blue-900 font-semibold text-lg rounded-lg hover:bg-blue-50 transition-all duration-300">
            Login to Campus
          </button>
        </Link>
      </div>

      {/* Scroll indicator */}
      <div className="mt-14 text-gray-400">
        <p className="text-sm mb-2">Scroll to explore</p>
        <div className="w-6 h-10 border-2 border-gray-300 rounded-full mx-auto flex justify-center pt-2">
          <div className="w-1 h-2 bg-gray-400 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
