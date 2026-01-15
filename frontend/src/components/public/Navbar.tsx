'use client';

/**
 * Navbar Component
 *
 * Clean, simple navigation bar.
 * School name uses Bambi font, all other text uses Nunito.
 */

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '#about', label: 'About' },
    { href: '#achievers', label: 'Achievers' },
    { href: '#activities', label: 'Celebrations' },
    { href: '#admission', label: 'Admission' },
    { href: '/login', label: 'Login' },
  ];

  return (
    <nav className="w-full px-4 md:px-10 py-4 bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* School Name - Bambi Font, All Caps, Single Line */}
        <Link href="/">
          <h1 className="font-bambi text-lg sm:text-xl md:text-2xl text-blue-900 hover:opacity-80 transition-opacity whitespace-nowrap">
            JESUS JUNIOR ACADEMY
          </h1>
        </Link>

        {/* Desktop Menu Links - Nunito Font */}
        <div className="hidden md:flex items-center space-x-6 font-semibold text-gray-700">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-blue-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-gray-700 hover:text-blue-900 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu - Nunito Font */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 border-t pt-4">
          <div className="flex flex-col space-y-4 font-semibold text-gray-700">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-blue-900 transition-colors px-2 py-1"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
