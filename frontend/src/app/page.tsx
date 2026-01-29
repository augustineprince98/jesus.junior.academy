'use client';

/**
 * Public Homepage - Igloo.inc Inspired
 *
 * Full-page immersive scroll experience with:
 * - Infinite scroll loop (footer -> hero seamless transition)
 * - Scroll-driven section transitions (scale, blur, chromatic aberration)
 * - Particle field hero background
 * - Text scramble animations
 * - Sticky stacking sections with dramatic entrances
 */

import Navbar from '@/components/public/Navbar';
import HeroSection from '@/components/public/HeroSection';
import PublicNoticeBoard from '@/components/public/PublicNoticeBoard';
import FloatingShapes from '@/components/public/FloatingShapes';
import AboutSection from '@/components/public/AboutSection';
import AchieversSection from '@/components/public/AchieversSection';
import ActivitiesSection from '@/components/public/ActivitiesSection';
import AdmissionSection from '@/components/public/AdmissionSection';
import Footer from '@/components/public/Footer';
import InfiniteScrollWrapper from '@/components/public/InfiniteScrollWrapper';
import ScrollSection from '@/components/public/ScrollSection';

export default function HomePage() {
  return (
    <InfiniteScrollWrapper>
      <main className="bg-[#0A0A0A] relative">
        {/* Navigation Bar - Fixed on top */}
        <Navbar />

        {/* Hero Section - Base Layer with particles */}
        <ScrollSection index={0} isEdge>
          <HeroSection />
        </ScrollSection>

        {/* Notice Board */}
        <ScrollSection index={1} bgColor="#0A0A0A">
          <PublicNoticeBoard />
        </ScrollSection>

        {/* Discover Our Story */}
        <ScrollSection index={2} bgColor="#111111">
          <FloatingShapes />
          <AboutSection />
        </ScrollSection>

        {/* Achievers Club */}
        <ScrollSection index={3} bgColor="#0A0A0A">
          <AchieversSection />
        </ScrollSection>

        {/* Celebrations & Events */}
        <ScrollSection index={4} bgColor="#111111">
          <ActivitiesSection />
        </ScrollSection>

        {/* Start Your Journey */}
        <ScrollSection index={5} bgColor="#0A0A0A">
          <FloatingShapes />
          <AdmissionSection />
        </ScrollSection>

        {/* Footer */}
        <ScrollSection index={6} bgColor="#0A0A0A">
          <div className="min-h-screen flex flex-col justify-end">
            <Footer />
          </div>
        </ScrollSection>
      </main>
    </InfiniteScrollWrapper>
  );
}
