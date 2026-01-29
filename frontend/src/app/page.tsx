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
import PublicNoticeBoard from '@/components/public/PublicNoticeBoard';
import FloatingShapes from '@/components/public/FloatingShapes';
import AboutSection from '@/components/public/AboutSection';
import AchieversSection from '@/components/public/AchieversSection';
import ActivitiesSection from '@/components/public/ActivitiesSection';
import AdmissionSection from '@/components/public/AdmissionSection';
import Footer from '@/components/public/Footer';

const SectionWrapper = ({
  children,
  zIndex
}: {
  children: React.ReactNode;
  zIndex: number;
}) => (
  <div
    className="sticky top-0 min-h-screen w-full flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.4)] rounded-t-[2.5rem] overflow-hidden border-t border-white/10"
    style={{ zIndex }}
  >
    {children}
  </div>
);

export default function HomePage() {
  return (
    <main className="bg-[#0A0A0A] relative">
      {/* Navigation Bar - Fixed on top */}
      <Navbar />

      {/* Hero Section - Base Layer */}
      {/* Hero handles its own sticky behavior inside, so we keep it relative or z-0 */}
      <div className="relative z-0">
        <HeroSection />
      </div>

      {/* Stacking Sections */}
      {/* Each subsequent section slides over the previous one */}

      <SectionWrapper zIndex={10}>
        <div className="bg-[#0A0A0A] min-h-screen flex flex-col justify-center">
          <PublicNoticeBoard />
        </div>
      </SectionWrapper>

      <SectionWrapper zIndex={20}>
        <div className="bg-[#111111] min-h-screen flex flex-col justify-center relative">
          <FloatingShapes />
          <AboutSection />
        </div>
      </SectionWrapper>

      <SectionWrapper zIndex={30}>
        <div className="bg-[#0A0A0A] min-h-screen flex flex-col justify-center">
          <AchieversSection />
        </div>
      </SectionWrapper>

      <SectionWrapper zIndex={40}>
        <div className="bg-[#111111] min-h-screen flex flex-col justify-center">
          <ActivitiesSection />
        </div>
      </SectionWrapper>

      <SectionWrapper zIndex={50}>
        <div className="bg-[#0A0A0A] min-h-screen flex flex-col justify-center relative">
          <FloatingShapes />
          <AdmissionSection />
        </div>
      </SectionWrapper>

      {/* Footer - Final Slide */}
      <SectionWrapper zIndex={60}>
        <div className="bg-[#0A0A0A] min-h-screen flex flex-col justify-end">
          <Footer />
        </div>
      </SectionWrapper>
    </main>
  );
}
