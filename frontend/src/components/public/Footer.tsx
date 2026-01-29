'use client';

/**
 * Footer Component - Igloo-Inspired Design
 *
 * Dark elegant footer with gradient accent,
 * refined typography, and subtle glow effects.
 */

import Link from 'next/link';
import { Phone, Mail, MapPin, ArrowRight, Heart, Sparkles } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: '#about', label: 'About Us' },
    { href: '/achievers', label: 'Achievers' },
    { href: '/celebrations', label: 'Celebrations' },
    { href: '#admission', label: 'Admission' },
    { href: '/login', label: 'Login' },
    { href: '/campus', label: 'Digital Campus' },
  ];

  return (
    <footer className="relative overflow-hidden">
      {/* Gradient accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#6691E5] to-transparent" />

      {/* Main Footer */}
      <div className="bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-3 gap-12">
            {/* School Info */}
            <div>
              <h2 className="font-bambi text-2xl text-white mb-4">JESUS JUNIOR ACADEMY</h2>
              <p className="text-[#F5D76E] text-sm font-medium mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                "THE TRUTH SHALL MAKE YOU FREE."
              </p>
              <p className="text-white/40 text-sm leading-relaxed">
                Providing quality education rooted in Christian values. Nurturing young minds to
                become responsible citizens and future leaders.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-bold text-lg mb-6">Quick Links</h3>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group text-sm"
                    >
                      <ArrowRight className="w-4 h-4 text-[#6691E5] group-hover:translate-x-1 transition-transform" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-white font-bold text-lg mb-6">Contact Us</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="icon-circle icon-circle-sm icon-circle-accent flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="text-sm text-white/40">
                    <p>Church House, Near SBI Bank</p>
                    <p>Rewari, Haryana, India</p>
                  </div>
                </li>
                <li>
                  <a
                    href="tel:+918059589595"
                    className="flex items-center gap-3 group"
                  >
                    <div className="icon-circle icon-circle-sm icon-circle-gold flex-shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-white/40 group-hover:text-white transition-colors">
                      +91-8059589595
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:info@jesusja.com"
                    className="flex items-center gap-3 group"
                  >
                    <div className="icon-circle icon-circle-sm icon-circle-accent flex-shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-white/40 group-hover:text-white transition-colors">
                      info@jesusja.com
                    </span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              {/* Copyright */}
              <p className="text-sm text-white/30 flex items-center gap-1">
                © {currentYear} Jesus Junior Academy. Made with
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                in India
              </p>

              {/* Policy Links */}
              <div className="flex gap-6 text-sm text-white/30">
                <Link
                  href="/privacy-policy"
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
