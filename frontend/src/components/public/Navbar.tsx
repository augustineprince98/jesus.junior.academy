'use client';

/**
 * Navbar Component - Igloo-Inspired Design
 *
 * Transparent floating navbar with glass effect on scroll,
 * minimal links, and subtle glow effects.
 */

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#about', label: 'About' },
    { href: '/achievers', label: 'Achievers' },
    { href: '/celebrations', label: 'Celebrations' },
    { href: '#admission', label: 'Admission' },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`absolute top-0 left-0 right-0 z-50 transition-all duration-500 py-6`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo / School Name */}
        <Link href="/" className="group">
          <h1 className="font-bambi text-xl md:text-2xl text-[var(--text-primary)] tracking-wide transition-all duration-300 group-hover:text-[var(--accent-blue)]">
            JESUS JUNIOR ACADEMY
          </h1>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link text-sm">
              {link.label}
            </Link>
          ))}
          <Link href="/login">
            <button className="btn btn-primary px-6 py-2.5 text-sm flex items-center gap-2 group">
              Login
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-lg hover:bg-[var(--glass-hover)]"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden"
          >
            <div className="px-6 py-6 mt-4 mx-4 glass rounded-2xl">
              <div className="flex flex-col space-y-1">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-3 text-[var(--text-primary)]/80 font-medium hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover)] rounded-xl transition-all"
                    >
                      {link.label}
                      <ArrowRight className="w-4 h-4 text-[var(--text-secondary)]" />
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.05 }}
                  className="pt-4"
                >
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <button className="btn btn-primary w-full py-3.5 text-base">
                      Login to Campus
                    </button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
