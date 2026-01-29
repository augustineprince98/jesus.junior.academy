'use client';

/**
 * Admission Enquiry Section - Igloo.inc Inspired
 *
 * Enhanced with scroll-driven parallax,
 * dramatic form entrance, and premium effects.
 */

import { Send, Phone, Mail, MapPin, CheckCircle, GraduationCap, Loader2, Users, Sparkles } from 'lucide-react';
import { useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

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
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const headerY = useTransform(scrollYProgress, [0, 0.3], [80, 0]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);

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

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Visit Us',
      content: 'Church House, Near SBI Bank, Rewari, Haryana',
      color: 'blue',
    },
    {
      icon: Phone,
      title: 'Call Us',
      content: '+91-8059589595',
      href: 'tel:+918059589595',
      color: 'gold',
    },
    {
      icon: Mail,
      title: 'Email Us',
      content: 'info@jesusja.com',
      href: 'mailto:info@jesusja.com',
      color: 'blue',
    },
  ];

  const classOptions = [
    'Nursery', 'LKG', 'UKG',
    'Class 1', 'Class 2', 'Class 3', 'Class 4',
    'Class 5', 'Class 6', 'Class 7', 'Class 8',
  ];

  return (
    <section id="admission" ref={sectionRef} className="section-dark py-24 md:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-dots" />
      <div className="absolute top-0 left-0 right-0 section-divider-glow" />
      <div className="glow-orb glow-orb-blue w-[400px] h-[400px] top-0 left-1/4 opacity-15" />
      <div className="glow-orb glow-orb-gold w-[300px] h-[300px] bottom-20 right-0 opacity-20" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          style={{ y: headerY, opacity: headerOpacity }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="badge badge-gold text-sm mb-6 inline-flex"
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Start Your Journey
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
          >
            Admission <span className="text-gradient-gold">Enquiry</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-white/50 max-w-2xl mx-auto text-lg"
          >
            Take the first step towards your child's bright future with quality education
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -40, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                className="icon-circle icon-circle-md icon-circle-accent"
              >
                <Users className="w-5 h-5" />
              </motion.div>
              Get in Touch
            </h3>

            {/* Contact Cards */}
            <div className="space-y-4">
              {contactInfo.map((item, index) => {
                const Icon = item.icon;
                const isGold = item.color === 'gold';
                const Wrapper = item.href ? 'a' : 'div';

                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.12, duration: 0.6 }}
                    whileHover={{ x: 6, transition: { duration: 0.2 } }}
                  >
                    <Wrapper
                      {...(item.href ? { href: item.href } : {})}
                      className="flex items-start gap-4 p-5 glass-card group cursor-pointer"
                    >
                      <div
                        className={`icon-circle icon-circle-md flex-shrink-0 ${isGold ? 'icon-circle-gold' : 'icon-circle-accent'}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-1">{item.title}</h4>
                        <p className={`text-sm leading-relaxed ${item.href ? 'text-[#6691E5] group-hover:text-white' : 'text-white/60'} transition-colors`}>
                          {item.content}
                        </p>
                      </div>
                    </Wrapper>
                  </motion.div>
                );
              })}
            </div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="mt-8 gradient-border p-6"
            >
              <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#F5D76E]" />
                Why Choose Us?
              </h4>
              <ul className="space-y-3 text-sm text-white/60">
                {[
                  'Experienced & Dedicated Teachers',
                  'Value-Based Education',
                  'Safe & Nurturing Environment',
                  'Modern Teaching Methods',
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle className="w-4 h-4 text-[#F5D76E] flex-shrink-0" />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </motion.div>

          {/* Right: Enquiry Form */}
          <motion.div
            initial={{ opacity: 0, x: 40, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-10 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="icon-circle icon-circle-lg icon-circle-gold mx-auto mb-6"
                >
                  <CheckCircle className="w-8 h-8" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-3">Thank You!</h3>
                <p className="text-white/60 mb-8">
                  We have received your enquiry. Our team will contact you shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="btn btn-gold px-8 py-3"
                >
                  Submit Another Enquiry
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="gradient-border p-8">
                <div className="space-y-5">
                  {/* Student Name */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Student Name <span className="text-[#F5D76E]">*</span>
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
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Parent/Guardian Name <span className="text-[#F5D76E]">*</span>
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
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Contact Number <span className="text-[#F5D76E]">*</span>
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
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Class Seeking Admission <span className="text-[#F5D76E]">*</span>
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
                      className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                    >
                      <p className="text-sm text-red-400">{error}</p>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={submitting}
                    whileHover={{ scale: submitting ? 1 : 1.02 }}
                    whileTap={{ scale: submitting ? 1 : 0.98 }}
                    className={`w-full btn btn-gold py-4 text-lg flex items-center justify-center gap-2 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
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
                  </motion.button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
