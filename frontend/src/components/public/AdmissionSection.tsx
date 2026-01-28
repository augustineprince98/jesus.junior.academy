'use client';

/**
 * Admission Enquiry Section - Premium Design
 *
 * Elegant admission form with refined styling,
 * animations, and premium visual hierarchy.
 */

import { Send, Phone, Mail, MapPin, CheckCircle, GraduationCap, Loader2, Users } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function AdmissionSection() {
  const [formData, setFormData] = useState({
    child_name: '',
    parent_name: '',
    contact_number: '',
    seeking_class: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://jja-backend.onrender.com'}/admissions/enquiry`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error('Failed to submit enquiry');

      setSubmitted(true);
      setFormData({ child_name: '', parent_name: '', contact_number: '', seeking_class: '' });
    } catch (err) {
      setError('Failed to submit enquiry. Please try again or contact us directly.');
      console.error('Enquiry submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-50px' },
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Visit Us',
      content: (
        <>
          Jesus Junior Academy
          <br />
          Church House, Near SBI Bank
          <br />
          Rewari, Haryana
        </>
      ),
      color: 'bg-blue-500',
    },
    {
      icon: Phone,
      title: 'Call Us',
      content: (
        <a href="tel:+918059589595" className="text-blue-600 hover:text-blue-800 font-semibold">
          +91-8059589595
        </a>
      ),
      color: 'bg-emerald-500',
    },
    {
      icon: Mail,
      title: 'Email Us',
      content: (
        <a href="mailto:info@jesusja.com" className="text-blue-600 hover:text-blue-800 font-semibold">
          info@jesusja.com
        </a>
      ),
      color: 'bg-purple-500',
    },
  ];

  const classOptions = [
    'Nursery',
    'LKG',
    'UKG',
    'Class 1',
    'Class 2',
    'Class 3',
    'Class 4',
    'Class 5',
    'Class 6',
    'Class 7',
    'Class 8',
  ];

  return (
    <section id="admission" className="py-20 md:py-28 bg-gradient-to-b from-white to-blue-50 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 right-20 w-96 h-96 bg-blue-100 rounded-full opacity-30 blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-100 rounded-full opacity-30 blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative">
        {/* Section Header */}
        <motion.div {...fadeInUp} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold mb-6">
            <GraduationCap className="w-4 h-4" />
            Start Your Journey
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Admission <span className="text-blue-900">Enquiry</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Take the first step towards your child's bright future with quality education
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Contact Information */}
          <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
            <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-700" />
              </div>
              Get in Touch
            </h3>

            {/* Contact Cards */}
            <div className="space-y-4">
              {contactInfo.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    {...fadeInUp}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 group"
                  >
                    <div
                      className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center flex-shrink-0 text-white group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{item.content}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Trust Badges */}
            <motion.div
              {...fadeInUp}
              transition={{ delay: 0.5 }}
              className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100"
            >
              <h4 className="font-bold text-gray-900 mb-3">Why Choose Us?</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                {[
                  'Experienced & Dedicated Teachers',
                  'Value-Based Education',
                  'Safe & Nurturing Environment',
                  'Modern Teaching Methods',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>

          {/* Right: Enquiry Form */}
          <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-3xl p-10 text-center"
              >
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-800 mb-3">Thank You!</h3>
                <p className="text-emerald-700 mb-8">
                  We have received your enquiry. Our team will contact you shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-8 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Submit Another Enquiry
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-premium">
                <div className="space-y-5">
                  {/* Student Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Student Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="child_name"
                      value={formData.child_name}
                      onChange={handleChange}
                      required
                      className="input"
                      placeholder="Enter student's full name"
                    />
                  </div>

                  {/* Parent Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Parent/Guardian Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="parent_name"
                      value={formData.parent_name}
                      onChange={handleChange}
                      required
                      className="input"
                      placeholder="Enter parent's name"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="contact_number"
                      value={formData.contact_number}
                      onChange={handleChange}
                      required
                      pattern="[6-9][0-9]{9}"
                      className="input"
                      placeholder="10-digit mobile number"
                    />
                  </div>

                  {/* Desired Class */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Class Seeking Admission <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="seeking_class"
                      value={formData.seeking_class}
                      onChange={handleChange}
                      required
                      className="input"
                    >
                      <option value="">Select a class</option>
                      {classOptions.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-50 border border-red-200 rounded-xl"
                    >
                      <p className="text-sm text-red-700">{error}</p>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${submitting
                        ? 'opacity-70 cursor-not-allowed'
                        : 'hover:from-blue-500 hover:to-blue-600 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5'
                      }`}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Submit Enquiry
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
