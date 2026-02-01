'use client';

/**
 * IntroSequence - Cinematic Opening (Igloo.inc Inspired)
 *
 * Multi-phase dramatic intro:
 * Phase 1: Deep black with subtle noise grain
 * Phase 2: Thin horizontal light streak scans the screen
 * Phase 3: Shield materializes from particles with intense glow
 * Phase 4: Light burst + school name letter-by-letter with chromatic split
 * Phase 5: Motto fades in with letter-spacing animation
 * Phase 6: Everything collapses inward then explodes outward to reveal site
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroSequenceProps {
    children: React.ReactNode;
    skipIntro?: boolean;
}

export default function IntroSequence({ children, skipIntro = false }: IntroSequenceProps) {
    const [phase, setPhase] = useState<'black' | 'scan' | 'logo' | 'burst' | 'text' | 'collapse' | 'done'>('black');
    const [showIntro, setShowIntro] = useState(false);

    useEffect(() => {
        if (skipIntro) {
            setPhase('done');
            return;
        }

        setShowIntro(true);

        // Cinematic timeline - slower, more dramatic
        const timeline: { phase: typeof phase; delay: number }[] = [
            { phase: 'scan', delay: 400 },
            { phase: 'logo', delay: 1600 },
            { phase: 'burst', delay: 3200 },
            { phase: 'text', delay: 3800 },
            { phase: 'collapse', delay: 6200 },
            { phase: 'done', delay: 7400 },
        ];

        const timeouts = timeline.map(({ phase: p, delay }) =>
            setTimeout(() => setPhase(p), delay)
        );

        sessionStorage.setItem('intro-shown', 'true');
        return () => timeouts.forEach(clearTimeout);
    }, [skipIntro]);

    if (phase === 'done' && !showIntro) {
        return <>{children}</>;
    }

    const isActive = phase !== 'done';
    const showShield = phase === 'logo' || phase === 'burst' || phase === 'text' || phase === 'collapse';
    const showText = phase === 'text' || phase === 'collapse';
    const isCollapsing = phase === 'collapse';

    return (
        <>
            {/* Main content underneath */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: phase === 'done' ? 1 : 0 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            >
                {children}
            </motion.div>

            {/* Intro Overlay */}
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.0, ease: [0.76, 0, 0.24, 1] }}
                        className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center overflow-hidden"
                    >
                        {/* Film grain noise overlay */}
                        <div
                            className="absolute inset-0 z-50 pointer-events-none opacity-[0.04]"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                                mixBlendMode: 'overlay',
                            }}
                        />

                        {/* Vignette */}
                        <div className="absolute inset-0 z-40 pointer-events-none" style={{
                            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)',
                        }} />

                        {/* Horizontal scan line */}
                        <motion.div
                            initial={{ top: '-2px', opacity: 0 }}
                            animate={{
                                top: phase === 'scan' ? ['0%', '100%'] : '0%',
                                opacity: phase === 'scan' ? [0, 1, 1, 0] : 0,
                            }}
                            transition={{ duration: 1.2, ease: 'linear' }}
                            className="absolute left-0 right-0 h-[2px] z-30"
                            style={{
                                background: 'linear-gradient(90deg, transparent 5%, rgba(102,145,229,0.8) 30%, rgba(255,255,255,0.9) 50%, rgba(245,215,110,0.8) 70%, transparent 95%)',
                                boxShadow: '0 0 30px rgba(102,145,229,0.6), 0 0 60px rgba(102,145,229,0.3), 0 0 120px rgba(245,215,110,0.15)',
                            }}
                        />

                        {/* Secondary scan lines (subtle) */}
                        {phase === 'scan' && (
                            <>
                                <motion.div
                                    initial={{ top: '100%', opacity: 0 }}
                                    animate={{ top: ['100%', '0%'], opacity: [0, 0.3, 0.3, 0] }}
                                    transition={{ duration: 1.2, ease: 'linear', delay: 0.15 }}
                                    className="absolute left-0 right-0 h-[1px] z-20"
                                    style={{ background: 'linear-gradient(90deg, transparent, rgba(102,145,229,0.3), transparent)' }}
                                />
                            </>
                        )}

                        {/* Deep background glow - builds up slowly */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.3 }}
                            animate={{
                                opacity: showShield ? (isCollapsing ? 0 : 0.5) : 0,
                                scale: isCollapsing ? 5 : showShield ? 1.5 : 0.3,
                            }}
                            transition={{ duration: isCollapsing ? 0.8 : 2, ease: 'easeOut' }}
                            className="absolute w-[500px] h-[500px] rounded-full z-0"
                            style={{
                                background: 'radial-gradient(circle, rgba(102,145,229,0.2) 0%, rgba(245,215,110,0.1) 40%, transparent 70%)',
                                filter: 'blur(80px)',
                            }}
                        />

                        {/* Orbiting particles around shield */}
                        {showShield && !isCollapsing && (
                            <>
                                {[...Array(12)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{
                                            opacity: [0, 0.8, 0],
                                            scale: [0, 1, 0],
                                            x: [0, Math.cos((i * Math.PI * 2) / 12) * 180],
                                            y: [0, Math.sin((i * Math.PI * 2) / 12) * 180],
                                        }}
                                        transition={{
                                            duration: 2.5,
                                            delay: 0.1 * i,
                                            ease: 'easeOut',
                                        }}
                                        className="absolute z-10"
                                        style={{
                                            width: 3 + Math.random() * 3,
                                            height: 3 + Math.random() * 3,
                                            borderRadius: '50%',
                                            background: i % 2 === 0 ? '#6691E5' : '#F5D76E',
                                            boxShadow: `0 0 ${10 + i * 2}px ${i % 2 === 0 ? 'rgba(102,145,229,0.6)' : 'rgba(245,215,110,0.5)'}`,
                                        }}
                                    />
                                ))}
                            </>
                        )}

                        {/* Shield Logo - dramatic entrance */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0, rotateY: 90 }}
                            animate={{
                                opacity: showShield ? (isCollapsing ? 0 : 1) : 0,
                                scale: isCollapsing ? 0.2 : showShield ? 1 : 0,
                                rotateY: showShield ? 0 : 90,
                                y: showText ? -80 : 0,
                            }}
                            transition={{
                                duration: isCollapsing ? 0.6 : 1.0,
                                ease: isCollapsing ? [0.76, 0, 0.24, 1] : [0.22, 1, 0.36, 1],
                            }}
                            className="relative z-20"
                            style={{ perspective: 1000 }}
                        >
                            <div className="w-36 h-36 md:w-52 md:h-52 relative">
                                {/* Pulsing glow ring behind shield */}
                                <motion.div
                                    animate={{
                                        scale: [1, 1.3, 1],
                                        opacity: [0.3, 0.7, 0.3],
                                    }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute inset-[-20%] rounded-full"
                                    style={{
                                        background: 'radial-gradient(circle, rgba(102,145,229,0.25) 0%, transparent 70%)',
                                        filter: 'blur(20px)',
                                    }}
                                />

                                {/* Shimmer sweep */}
                                <motion.div
                                    initial={{ x: '-150%' }}
                                    animate={{ x: showShield ? ['-150%', '250%'] : '-150%' }}
                                    transition={{ duration: 1.8, delay: 0.4, ease: 'easeInOut' }}
                                    className="absolute inset-0 z-20"
                                    style={{
                                        background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)',
                                    }}
                                />

                                {/* Shield SVG */}
                                <svg viewBox="0 0 200 200" className="w-full h-full" style={{
                                    filter: 'drop-shadow(0 0 40px rgba(102,145,229,0.5)) drop-shadow(0 0 80px rgba(102,145,229,0.2))',
                                }}>
                                    <defs>
                                        <linearGradient id="introShieldFill" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#1a1a2e" />
                                            <stop offset="50%" stopColor="#0f0f1a" />
                                            <stop offset="100%" stopColor="#050510" />
                                        </linearGradient>
                                        <linearGradient id="introStrokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#6691E5" />
                                            <stop offset="50%" stopColor="#F5D76E" />
                                            <stop offset="100%" stopColor="#6691E5" />
                                        </linearGradient>
                                        <filter id="introGlow2">
                                            <feGaussianBlur stdDeviation="4" result="blur" />
                                            <feMerge>
                                                <feMergeNode in="blur" />
                                                <feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                    </defs>

                                    {/* Outer orbital rings */}
                                    <motion.circle
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{
                                            pathLength: showShield ? 1 : 0,
                                            opacity: showShield ? 0.2 : 0,
                                        }}
                                        transition={{ duration: 2, ease: 'easeOut' }}
                                        cx="100" cy="100" r="96"
                                        fill="none" stroke="url(#introStrokeGrad)" strokeWidth="0.5"
                                    />
                                    <motion.circle
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{
                                            pathLength: showShield ? 1 : 0,
                                            opacity: showShield ? 0.4 : 0,
                                        }}
                                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                                        cx="100" cy="100" r="90"
                                        fill="none" stroke="url(#introStrokeGrad)" strokeWidth="1.5"
                                    />

                                    {/* Shield body - draws in */}
                                    <motion.path
                                        initial={{ pathLength: 0, fillOpacity: 0 }}
                                        animate={{
                                            pathLength: showShield ? 1 : 0,
                                            fillOpacity: showShield ? 1 : 0,
                                        }}
                                        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                                        d="M100 15 L170 45 V105 C170 150 100 185 100 185 C100 185 30 150 30 105 V45 L100 15 Z"
                                        fill="url(#introShieldFill)"
                                        stroke="url(#introStrokeGrad)"
                                        strokeWidth="2.5"
                                        filter="url(#introGlow2)"
                                    />

                                    {/* Cross - appears with glow */}
                                    <motion.g
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: showShield ? 1 : 0 }}
                                        transition={{ duration: 0.8, delay: 1.2 }}
                                    >
                                        <motion.path
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: showShield ? 1 : 0 }}
                                            transition={{ duration: 0.8, delay: 1.2 }}
                                            d="M100 48 V142"
                                            stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"
                                            filter="url(#introGlow2)"
                                        />
                                        <motion.path
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: showShield ? 1 : 0 }}
                                            transition={{ duration: 0.6, delay: 1.5 }}
                                            d="M65 82 H135"
                                            stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"
                                            filter="url(#introGlow2)"
                                        />
                                    </motion.g>
                                </svg>
                            </div>
                        </motion.div>

                        {/* Light burst flash on phase transition */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: phase === 'burst' ? [0, 0.6, 0] : 0,
                            }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="absolute inset-0 z-30 pointer-events-none"
                            style={{
                                background: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, rgba(102,145,229,0.2) 40%, transparent 70%)',
                            }}
                        />

                        {/* School Name - dramatic cinematic reveal */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: showText ? (isCollapsing ? 0 : 1) : 0,
                                scale: isCollapsing ? 0.8 : 1,
                            }}
                            transition={{
                                duration: isCollapsing ? 0.5 : 0.3,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="mt-10 text-center z-20 relative"
                        >
                            {/* Main title - each letter animates in with chromatic split feel */}
                            <h1 className="flex justify-center flex-wrap gap-x-[0.12em]">
                                {"JESUS JUNIOR ACADEMY".split("").map((char, i) => (
                                    <motion.span
                                        key={i}
                                        initial={{
                                            opacity: 0,
                                            y: 60,
                                            filter: 'blur(20px)',
                                            scale: 1.4,
                                        }}
                                        animate={showText ? {
                                            opacity: 1,
                                            y: 0,
                                            filter: 'blur(0px)',
                                            scale: 1,
                                        } : {}}
                                        transition={{
                                            duration: 0.9,
                                            delay: i * 0.04,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                        className="font-bambi text-3xl sm:text-4xl md:text-6xl text-white tracking-wider inline-block"
                                        style={{
                                            textShadow: '0 0 40px rgba(255,255,255,0.3), 0 0 80px rgba(102,145,229,0.2), 0 0 120px rgba(245,215,110,0.1)',
                                        }}
                                    >
                                        {char === " " ? "\u00A0" : char}
                                    </motion.span>
                                ))}
                            </h1>

                            {/* Gold divider line */}
                            <motion.div
                                initial={{ scaleX: 0, opacity: 0 }}
                                animate={showText ? { scaleX: 1, opacity: 1 } : {}}
                                transition={{
                                    delay: 0.8,
                                    duration: 1.2,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="h-[1px] mx-auto mt-6 origin-center"
                                style={{
                                    width: '120%',
                                    marginLeft: '-10%',
                                    background: 'linear-gradient(90deg, transparent, rgba(245,215,110,0.6), rgba(102,145,229,0.4), transparent)',
                                    boxShadow: '0 0 20px rgba(245,215,110,0.3)',
                                }}
                            />

                            {/* Motto */}
                            <motion.p
                                initial={{ opacity: 0, letterSpacing: '0.1em', y: 15 }}
                                animate={showText ? {
                                    opacity: 0.7,
                                    letterSpacing: '0.5em',
                                    y: 0,
                                } : {}}
                                transition={{
                                    delay: 1.2,
                                    duration: 1.8,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="text-white/50 text-[10px] sm:text-xs md:text-sm mt-8 uppercase font-light"
                            >
                                The Truth Shall Make You Free
                            </motion.p>
                        </motion.div>

                        {/* Bottom loading bar */}
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{
                                scaleX: phase === 'black' ? 0
                                    : phase === 'scan' ? 0.2
                                    : phase === 'logo' ? 0.5
                                    : phase === 'burst' ? 0.7
                                    : phase === 'text' ? 0.9
                                    : 1,
                            }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="absolute bottom-0 left-0 h-[2px] w-full origin-left z-40"
                            style={{
                                background: 'linear-gradient(90deg, #6691E5, #F5D76E)',
                            }}
                        />

                        {/* Collapse flash - white flash before site reveal */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: isCollapsing ? [0, 0.15, 0.4, 0] : 0,
                            }}
                            transition={{ duration: 1.0, ease: 'easeInOut' }}
                            className="absolute inset-0 bg-white z-50 pointer-events-none"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
