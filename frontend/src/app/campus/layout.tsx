'use client';

import ParticleField from '@/components/public/ParticleField';
import CampusHeader from '@/components/campus/CampusHeader';

export default function CampusLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent-blue)]/30">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <ParticleField />
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-blue)]/5 via-transparent to-[var(--accent-purple)]/5 mix-blend-screen" />
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />
            </div>

            {/* Header */}
            <CampusHeader />

            {/* Main Content Area */}
            {/* Added pt-20 to account for fixed header */}
            <div className="relative z-10 pt-20">
                {children}
            </div>
        </div>
    );
}
