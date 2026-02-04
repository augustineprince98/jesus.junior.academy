'use client';

/**
 * About Section - Igloo.inc Inspired
 *
 * Enhanced with scroll-driven parallax,
 * staggered reveals, and chromatic accents.
 */

import { BookOpen, Target, Heart, Sparkles } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const headerY = useTransform(scrollYProgress, [0, 0.3], [80, 0]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);
  const lineWidth = useTransform(scrollYProgress, [0.1, 0.35], ['0%', '100%']);

  const fadeInUp = (delay: number = 0) => ({
    initial: { opacity: 0, y: 50, filter: 'blur(10px)' },
    whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] },
  });

  const cards = [
    {
      icon: Target,
      title: 'Our Vision',
      description:
        'To be a leading institution that shapes well-rounded individuals who excel academically and contribute positively to society with integrity and compassion.',
      color: 'blue',
    },
    {
      icon: BookOpen,
      title: 'Our Mission',
      description:
        'To provide a Christ-centered education that nurtures intellectual growth, moral values, and practical skills, preparing students for a purposeful life.',
      color: 'gold',
    },
    {
      icon: Heart,
      title: 'Our Values',
      description:
        'Truth, integrity, compassion, excellence, and service. These core values guide everything we do and shape the character of our students.',
      color: 'blue',
    },
  ];

  return (
    <section id="about" ref={sectionRef} className="section-elevated py-24 md:py-32 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="absolute top-0 left-0 right-0 section-divider-glow" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Section Header - scroll parallax */}
        <motion.div
          style={{ y: headerY, opacity: headerOpacity }}
          className="text-center mb-20"
        >
          <motion.span
            {...fadeInUp(0)}
            className="badge badge-gold text-sm mb-6 inline-flex"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Discover Our Story
          </motion.span>
          <motion.h2
            {...fadeInUp(0.1)}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] mb-6 leading-tight"
          >
            Excellence in Education
            <br />
            <span className="text-gradient-accent">Rooted in Values</span>
          </motion.h2>
          <motion.div
            style={{ width: lineWidth }}
            className="h-1 bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-gold)] mx-auto rounded-full"
          />
        </motion.div>

        {/* Main Description */}
        <motion.p
          {...fadeInUp(0.2)}
          className="text-center text-lg md:text-xl text-[var(--text-secondary)] max-w-3xl mx-auto mb-20 leading-relaxed"
        >
          Jesus Junior Academy is committed to nurturing young minds through quality education,
          strong moral values, and a disciplined learning environment. We believe in holistic
          development through academics and co-curricular activities.
        </motion.p>

        {/* History & Philosophy Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {/* History */}
          <motion.div
            {...fadeInUp(0.3)}
            whileHover={{ y: -6, transition: { duration: 0.3 } }}
            className="gradient-border p-8 group"
          >
            <div className="flex items-center gap-4 mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.4 }}
                className="icon-circle icon-circle-md icon-circle-gold group-hover:scale-110 transition-transform"
              >
                <BookOpen className="w-6 h-6" />
              </motion.div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)]">Our History</h3>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              Founded with a vision to provide quality education rooted in Christian values,
              Jesus Junior Academy has been nurturing young minds and building strong character
              for years. Located in the heart of Rewari, near SBI Bank at Church House, we serve
              as a beacon of educational excellence in the community.
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Our institution stands on the foundation of truth, integrity, and academic excellence,
              preparing students not just for examinations but for life itself.
            </p>
          </motion.div>

          {/* Philosophy */}
          <motion.div
            {...fadeInUp(0.4)}
            whileHover={{ y: -6, transition: { duration: 0.3 } }}
            className="gradient-border p-8 group"
          >
            <div className="flex items-center gap-4 mb-6">
              <motion.div
                initial={{ scale: 0, rotate: 90 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.5 }}
                className="icon-circle icon-circle-md icon-circle-accent group-hover:scale-110 transition-transform"
              >
                <Sparkles className="w-6 h-6" />
              </motion.div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)]">Educational Philosophy</h3>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              We believe education is more than memorizing facts. It's about developing critical
              thinking, moral values, and a lifelong love for learning. Our curriculum balances
              academic rigor with character development.
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Every child is unique, and we strive to unlock their potential through personalized
              attention, innovative teaching methods, and a nurturing environment.
            </p>
          </motion.div>
        </div>

        {/* Vision, Mission, Values Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card, index) => {
            const Icon = card.icon;
            const isGold = card.color === 'gold';

            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 60, scale: 0.85 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{
                  delay: 0.5 + index * 0.15,
                  duration: 0.8,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.3 } }}
                className="glass-card p-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.6 + index * 0.15 }}
                  className={`icon-circle icon-circle-lg mx-auto mb-6 ${isGold ? 'icon-circle-gold' : 'icon-circle-accent'}`}
                >
                  <Icon className="w-7 h-7" />
                </motion.div>
                <h4 className="text-xl font-bold text-[var(--text-primary)] mb-4">{card.title}</h4>
                <p className="text-[var(--text-secondary)] leading-relaxed text-sm">{card.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
