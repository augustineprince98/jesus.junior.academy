'use client';

/**
 * Navbar Component - Premium Design
 *
 * Features scroll-based blur effect, smooth animations,
 * and elegant mobile menu.
 */

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '#about', label: 'About' },
    { href: '/achievers', label: 'Achievers' },
    { href: '/celebrations', label: 'Celebrations' },
    { href: '#admission', label: 'Admission' },
  ];

  return (
    <nav
      className={`navbar sticky top-0 z-50 border-b transition-all duration-300 ${scrolled
          ? 'navbar-scrolled border-gray-200'
          : 'border-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* School Name - Bambi Font */}
        <Link href="/" className="group">
          <h1 className="font-bambi text-lg sm:text-xl md:text-2xl text-blue-900 whitespace-nowrap transition-all duration-300 group-hover:text-blue-700">
            JESUS JUNIOR ACADEMY
          </h1>
        </Link>

        {/* Desktop Menu Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link">
              {link.label}
            </Link>
          ))}
          <Link href="/login">
            <button className="btn btn-primary px-6 py-2.5 text-sm">
              Login
            </button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-gray-700 hover:text-blue-900 transition-colors rounded-lg hover:bg-gray-100"
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
            <div className="py-4 border-t border-gray-100 mt-4">
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
                      className="flex items-center justify-between px-4 py-3 text-gray-700 font-semibold hover:bg-gray-50 hover:text-blue-900 rounded-lg transition-colors"
                    >
                      {link.label}
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.05 }}
                  className="pt-4 px-4"
                >
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <button className="btn btn-primary w-full py-3">
                      Login to Campus
                    </button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
