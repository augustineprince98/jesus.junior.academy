'use client';

/**
 * Public Homepage
 *
 * Clean, professional landing page for Jesus Junior Academy.
 * - Navbar with navigation links
 * - Hero Section with school name and tagline
 * - About the School
 * - Achievers Club
 * - Activities & Celebrations
 * - Admission Enquiry
 * - Footer
 */

import Navbar from '@/components/public/Navbar';
import HeroSection from '@/components/public/HeroSection';
import AboutSection from '@/components/public/AboutSection';
import AchieversSection from '@/components/public/AchieversSection';
import ActivitiesSection from '@/components/public/ActivitiesSection';
import AdmissionSection from '@/components/public/AdmissionSection';
import Footer from '@/components/public/Footer';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <Navbar />

      {/* Hero Section - Top Fold */}
      <HeroSection />

      {/* About the School */}
      <AboutSection />

      {/* Achievers Club */}
      <AchieversSection />

      {/* Activities & Celebrations */}
      <ActivitiesSection />

      {/* Admission Enquiry */}
      <AdmissionSection />

      {/* Footer */}
      <Footer />
    </main>
  );
}
