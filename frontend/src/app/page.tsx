'use client';

/**
 * Public Homepage - Igloo.inc Inspired
 *
 * Full-page immersive scroll experience with:
 * - Opening intro animation sequence
 * - 3D floating geometric shapes background
 * - Infinite scroll loop (footer -> hero seamless transition)
 * - Scroll-driven section transitions (scale, blur, chromatic aberration)
 * - Card-stacking effect with shadows
 * - Particle field hero background
 * - Text scramble animations
 */

import dynamic from 'next/dynamic';
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
import IntroSequence from '@/components/public/IntroSequence';

// Dynamically import Scene3D to avoid SSR issues with Three.js
const Scene3D = dynamic(() => import('@/components/public/Scene3D'), {
  ssr: false,
  loading: () => null,
});

const TOTAL_SECTIONS = 7;

export default function HomePage() {
  return (
    <IntroSequence>
      <InfiniteScrollWrapper>
        <main className="bg-[#0A0A0A] relative">
          {/* 3D Background Scene - Floating Geometric Shapes */}
          <div className="fixed inset-0 z-0">
            <Scene3D />
          </div>

          {/* Navigation Bar - Fixed on top */}
          <Navbar />

          {/* Hero Section - Base Layer with particles */}
          <ScrollSection index={0} isEdge totalSections={TOTAL_SECTIONS}>
            <HeroSection />
          </ScrollSection>

          {/* Notice Board */}
          <ScrollSection index={1} bgColor="#0A0A0A" totalSections={TOTAL_SECTIONS}>
            <PublicNoticeBoard />
          </ScrollSection>

          {/* Discover Our Story */}
          <ScrollSection index={2} bgColor="#111111" totalSections={TOTAL_SECTIONS}>
            <FloatingShapes />
            <AboutSection />
          </ScrollSection>

          {/* Achievers Club */}
          <ScrollSection index={3} bgColor="#0A0A0A" totalSections={TOTAL_SECTIONS}>
            <AchieversSection />
          </ScrollSection>

          {/* Celebrations & Events */}
          <ScrollSection index={4} bgColor="#111111" totalSections={TOTAL_SECTIONS}>
            <ActivitiesSection />
          </ScrollSection>

          {/* Start Your Journey */}
          <ScrollSection index={5} bgColor="#0A0A0A" totalSections={TOTAL_SECTIONS}>
            <FloatingShapes />
            <AdmissionSection />
          </ScrollSection>

          {/* Footer */}
          <ScrollSection index={6} bgColor="#0A0A0A" totalSections={TOTAL_SECTIONS}>
            <div className="min-h-screen flex flex-col justify-end">
              <Footer />
            </div>
          </ScrollSection>
        </main>
      </InfiniteScrollWrapper>
    </IntroSequence>
  );
}

