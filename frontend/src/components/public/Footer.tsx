'use client';

/**
 * Footer Component
 *
 * Clean, simple footer with contact info and quick links.
 * School name uses Bambi font, all other text uses Nunito.
 */

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 border-t">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Main Content */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* School Info */}
          <div className="text-center md:text-left">
            <h2 className="font-bambi text-xl text-blue-900 mb-3">
              JESUS JUNIOR ACADEMY
            </h2>
            <p className="text-gray-600 text-sm mb-2">
              "THE TRUTH SHALL MAKE YOU FREE."
            </p>
            <p className="text-gray-500 text-sm">
              Providing quality education rooted in Christian values.
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center">
            <h3 className="font-semibold text-gray-800 mb-3">Quick Links</h3>
            <div className="flex flex-col space-y-2 text-sm">
              <Link href="#about" className="text-gray-600 hover:text-blue-900 transition-colors">
                About Us
              </Link>
              <Link href="#achievers" className="text-gray-600 hover:text-blue-900 transition-colors">
                Achievers
              </Link>
              <Link href="#activities" className="text-gray-600 hover:text-blue-900 transition-colors">
                Celebrations
              </Link>
              <Link href="#admission" className="text-gray-600 hover:text-blue-900 transition-colors">
                Admission
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-blue-900 transition-colors">
                Login
              </Link>
              <Link href="/campus" className="text-gray-600 hover:text-blue-900 transition-colors">
                Digital Campus
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="text-center md:text-right">
            <h3 className="font-semibold text-gray-800 mb-3">Contact Us</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                Church House, Near SBI Bank<br />
                Rewari, Haryana, India
              </p>
              <p>
                <a href="tel:+918059589595" className="hover:text-blue-900 transition-colors">
                  +91-8059589595
                </a>
              </p>
              <p>
                <a href="mailto:info@jesusja.com" className="hover:text-blue-900 transition-colors">
                  info@jesusja.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <p className="text-sm text-gray-500">
              &copy; {currentYear} Jesus Junior Academy. All rights reserved.
            </p>

            {/* Policy Links */}
            <div className="flex gap-6 text-sm text-gray-500">
              <Link href="/privacy-policy" className="hover:text-blue-900 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-blue-900 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
