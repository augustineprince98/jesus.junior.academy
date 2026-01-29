'use client';

import { motion } from 'framer-motion';

export default function FloatingShapes() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Floating Cube/Orb 1 */}
            <motion.div
                animate={{
                    y: [0, -20, 0],
                    rotate: [0, 45, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute top-1/4 left-10 w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-3xl border border-white/5"
            />

            {/* Floating Cube/Orb 2 */}
            <motion.div
                animate={{
                    y: [0, 30, 0],
                    rotate: [0, -30, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
                className="absolute bottom-1/3 right-10 w-48 h-48 rounded-full bg-gradient-to-tr from-emerald-500/10 to-blue-500/10 blur-3xl"
            />

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />
        </div>
    );
}
