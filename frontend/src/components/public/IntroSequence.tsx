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
        if (skipIntro || sessionStorage.getItem('intro-shown') === 'true') {
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

                        {/* School Name with Scramble */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{
                                opacity: phase === 'text' || phase === 'zoom' ? 1 : 0,
                                y: phase === 'text' || phase === 'zoom' ? 0 : 30,
                            }}
                            transition={{ duration: 0.6 }}
                            className="mt-8 text-center z-10"
                        >
                            <h1 className="font-bambi text-3xl md:text-5xl text-white tracking-wider">
                                {schoolName}
                            </h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: phase === 'text' || phase === 'zoom' ? 0.6 : 0 }}
                                transition={{ delay: 0.5 }}
                                className="text-white/60 text-sm md:text-base mt-3 tracking-[0.3em] uppercase"
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
