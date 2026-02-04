'use client';

import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <motion.button
            onClick={toggleTheme}
            className="fixed bottom-6 right-6 z-[100] p-3 rounded-full glass-card border border-white/10 shadow-lg hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            aria-label="Toggle theme"
        >
            <motion.div
                initial={false}
                animate={{ rotate: theme === 'dark' ? 0 : 180 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            >
                {theme === 'dark' ? (
                    <Moon className="w-6 h-6 text-accent-blue" />
                ) : (
                    <Sun className="w-6 h-6 text-accent-gold" />
                )}
            </motion.div>
        </motion.button>
    );
}
