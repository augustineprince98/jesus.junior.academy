'use client';

/**
 * IntroSequence - Igloo.inc-style Opening Animation
 *
 * Full-screen dramatic intro that plays on first page load:
 * - Black screen fade in
 * - Shield/logo reveal with shimmer
 * - Text scramble for school name
 * - Zoom-out transition to main content
 *
 * Uses sessionStorage to only show once per session.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroSequenceProps {
    children: React.ReactNode;
    /** Skip intro and show content immediately */
    skipIntro?: boolean;
}

// Text scramble hook
function useTextScramble(text: string, startDelay: number, enabled: boolean) {
    const [displayed, setDisplayed] = useState('');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    useEffect(() => {
        if (!enabled) {
            setDisplayed(text);
            return;
        }

        let timeout: NodeJS.Timeout;
        let frame = 0;
        const totalFrames = text.length * 3;

        timeout = setTimeout(() => {
            const interval = setInterval(() => {
                frame++;
                const progress = frame / totalFrames;
                const revealedCount = Math.floor(progress * text.length);

                let result = '';
                for (let i = 0; i < text.length; i++) {
                    if (text[i] === ' ') {
                        result += ' ';
                    } else if (i < revealedCount) {
                        result += text[i];
                    } else if (i < revealedCount + 3) {
                        result += chars[Math.floor(Math.random() * chars.length)];
                    } else {
                        result += ' ';
                    }
                }
                setDisplayed(result);

                if (frame >= totalFrames) {
                    setDisplayed(text);
                    clearInterval(interval);
                }
            }, 25);

            return () => clearInterval(interval);
        }, startDelay);

        return () => clearTimeout(timeout);
    }, [text, startDelay, enabled]);

    return displayed;
}

export default function IntroSequence({ children, skipIntro = false }: IntroSequenceProps) {
    const [showIntro, setShowIntro] = useState(false);
    const [phase, setPhase] = useState<'black' | 'logo' | 'text' | 'zoom' | 'done'>('black');

    // Text scramble for school name
    const schoolName = useTextScramble('JESUS JUNIOR ACADEMY', 800, phase === 'text' || phase === 'zoom');

    useEffect(() => {
        // Check if intro was already shown this session
        // Check if intro was already shown this session
        // MOD: User requested to show intro every time (disabled "show once" feature)
        if (skipIntro) {
            setPhase('done');
            return;
        }

        setShowIntro(true);

        // Animation timeline
        const timeline = [
            { phase: 'logo' as const, delay: 300 },
            { phase: 'text' as const, delay: 1500 },
            { phase: 'zoom' as const, delay: 3500 },
            { phase: 'done' as const, delay: 4800 },
        ];

        const timeouts: NodeJS.Timeout[] = [];

        timeline.forEach(({ phase, delay }) => {
            const t = setTimeout(() => setPhase(phase), delay);
            timeouts.push(t);
        });

        // Mark intro as shown
        sessionStorage.setItem('intro-shown', 'true');

        return () => timeouts.forEach(clearTimeout);
    }, [skipIntro]);

    if (phase === 'done' && !showIntro) {
        return <>{children}</>;
    }

    return (
        <>
            {/* Main Content (visible after intro) */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: phase === 'done' ? 1 : 0 }}
                transition={{ duration: 0.8 }}
            >
                {children}
            </motion.div>

            {/* Intro Overlay */}
            <AnimatePresence>
                {phase !== 'done' && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="fixed inset-0 z-[9999] bg-[#0A0A0A] flex flex-col items-center justify-center overflow-hidden"
                    >
                        {/* Background glow */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{
                                opacity: phase === 'logo' || phase === 'text' ? 0.3 : phase === 'zoom' ? 0.6 : 0,
                                scale: phase === 'zoom' ? 3 : 1,
                            }}
                            transition={{ duration: 1.5, ease: 'easeOut' }}
                            className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#6691E5]/30 via-transparent to-[#F5D76E]/20 blur-[100px]"
                        />

                        {/* Shield Logo */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.3 }}
                            animate={{
                                opacity: phase === 'black' ? 0 : phase === 'zoom' ? 0 : 1,
                                scale: phase === 'black' ? 0.3 : phase === 'zoom' ? 15 : 1,
                                y: phase === 'text' || phase === 'zoom' ? -60 : 0,
                            }}
                            transition={{
                                duration: phase === 'zoom' ? 1.2 : 0.8,
                                ease: phase === 'zoom' ? [0.76, 0, 0.24, 1] : 'easeOut',
                            }}
                            className="relative z-10"
                        >
                            <div className="w-32 h-32 md:w-48 md:h-48 relative">
                                {/* Shimmer effect */}
                                <motion.div
                                    initial={{ x: '-100%' }}
                                    animate={{ x: phase === 'logo' ? '200%' : '-100%' }}
                                    transition={{ duration: 1.5, delay: 0.3 }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 z-20"
                                />

                                {/* Shield SVG */}
                                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_60px_rgba(102,145,229,0.5)]">
                                    <defs>
                                        <linearGradient id="introShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#1a1a2e" />
                                            <stop offset="50%" stopColor="#0f0f1a" />
                                            <stop offset="100%" stopColor="#000" />
                                        </linearGradient>
                                        <linearGradient id="introBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#6691E5" />
                                            <stop offset="50%" stopColor="#F5D76E" />
                                            <stop offset="100%" stopColor="#6691E5" />
                                        </linearGradient>
                                        <filter id="introGlow">
                                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                            <feMerge>
                                                <feMergeNode in="coloredBlur" />
                                                <feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                    </defs>

                                    {/* Outer rings */}
                                    <motion.circle
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: phase !== 'black' ? 1 : 0, opacity: phase !== 'black' ? 0.3 : 0 }}
                                        transition={{ duration: 1.5, ease: 'easeOut' }}
                                        cx="100" cy="100" r="95"
                                        fill="none" stroke="url(#introBorderGrad)" strokeWidth="1"
                                    />
                                    <motion.circle
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: phase !== 'black' ? 1 : 0, opacity: phase !== 'black' ? 0.5 : 0 }}
                                        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                                        cx="100" cy="100" r="88"
                                        fill="none" stroke="url(#introBorderGrad)" strokeWidth="2"
                                    />

                                    {/* Shield shape */}
                                    <motion.path
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: phase !== 'black' ? 1 : 0 }}
                                        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                                        d="M100 15 L170 45 V105 C170 150 100 185 100 185 C100 185 30 150 30 105 V45 L100 15 Z"
                                        fill="url(#introShieldGrad)"
                                        stroke="url(#introBorderGrad)"
                                        strokeWidth="3"
                                        filter="url(#introGlow)"
                                    />

                                    {/* Cross symbol */}
                                    <motion.path
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: phase !== 'black' ? 1 : 0, opacity: phase !== 'black' ? 0.9 : 0 }}
                                        transition={{ duration: 0.8, delay: 0.8 }}
                                        d="M100 50 V140 M65 85 H135"
                                        stroke="white"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        fill="none"
                                    />
                                </svg>
                            </div>
                        </motion.div>

                        {/* School Name with Cinematic Reveal */}
                        <motion.div
                            initial="hidden"
                            animate={phase === 'text' || phase === 'zoom' ? "visible" : "hidden"}
                            variants={{
                                hidden: { opacity: 0 },
                                visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
                            }}
                            className="mt-8 text-center z-10 relative overflow-visible"
                        >
                            <h1 className="flex justify-center flex-wrap gap-x-[0.1em]">
                                {"JESUS JUNIOR ACADEMY".split("").map((char, i) => (
                                    <motion.span
                                        key={i}
                                        variants={{
                                            hidden: {
                                                opacity: 0,
                                                y: 20,
                                                filter: "blur(12px)",
                                                scale: 1.1
                                            },
                                            visible: {
                                                opacity: 1,
                                                y: 0,
                                                filter: "blur(0px)",
                                                scale: 1,
                                                transition: {
                                                    duration: 1.2,
                                                    ease: [0.2, 0.65, 0.3, 0.9]
                                                }
                                            }
                                        }}
                                        className="font-bambi text-3xl md:text-5xl text-white tracking-wider inline-block"
                                        style={{
                                            textShadow: '0 0 30px rgba(255,255,255,0.3)'
                                        }}
                                    >
                                        {char === " " ? "\u00A0" : char}
                                    </motion.span>
                                ))}
                            </h1>

                            <motion.div
                                variants={{
                                    hidden: { opacity: 0, width: "0%" },
                                    visible: {
                                        opacity: 1,
                                        width: "140%",
                                        transition: { delay: 1.2, duration: 1.5, ease: "circOut" }
                                    }
                                }}
                                className="h-[1px] bg-gradient-to-r from-transparent via-[#F5D76E]/50 to-transparent absolute -bottom-4 left-1/2 -translate-x-1/2"
                            />

                            <motion.p
                                variants={{
                                    hidden: { opacity: 0, y: 10, letterSpacing: "0.2em" },
                                    visible: {
                                        opacity: 0.7,
                                        y: 0,
                                        letterSpacing: "0.4em",
                                        transition: { delay: 1.5, duration: 1.5, ease: "easeOut" }
                                    }
                                }}
                                className="text-white/60 text-xs md:text-sm mt-6 uppercase font-light"
                            >
                                The Truth Shall Make You Free
                            </motion.p>
                        </motion.div>

                        {/* Loading indicator */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: phase === 'logo' ? 0.5 : 0 }}
                            className="absolute bottom-12 flex gap-1"
                        >
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                                    className="w-2 h-2 bg-white/50 rounded-full"
                                />
                            ))}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
