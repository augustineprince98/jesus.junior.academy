'use client';

/**
 * About Section - Igloo-Inspired Design
 *
 * Dark section with glass cards, gradient borders,
 * and elegant animations.
 */

import { BookOpen, Target, Heart, Sparkles, GraduationCap, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AboutSection() {
  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-100px' },
    transition: { duration: 0.7 },
  };

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

  const stats = [
    { value: '30+', label: 'Years of Excellence', icon: GraduationCap },
    { value: '500+', label: 'Students & Alumni', icon: Users },
    { value: '50+', label: 'Expert Teachers', icon: Sparkles },
  ];

  return (
    <section id="about" className="section-elevated py-24 md:py-32 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid opacity-50" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div {...fadeInUp} className="text-center mb-20">
          <span className="badge badge-gold text-sm mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Discover Our Story
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Excellence in Education
            <br />
            <span className="text-gradient-accent">Rooted in Values</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#6691E5] to-[#F5D76E] mx-auto rounded-full" />
        </motion.div>

        {/* Main Description */}
        <motion.p
          {...fadeInUp}
          transition={{ delay: 0.1 }}
          className="text-center text-lg md:text-xl text-white/60 max-w-3xl mx-auto mb-20 leading-relaxed"
        >
          Jesus Junior Academy is committed to nurturing young minds through quality education,
          strong moral values, and a disciplined learning environment. We believe in holistic
          development through academics and co-curricular activities.
        </motion.p>

        {/* Stats Row */}
        <motion.div
          {...fadeInUp}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="glass-card p-8 text-center group"
              >
                <div className="icon-circle icon-circle-lg icon-circle-accent mx-auto mb-4">
                  <Icon className="w-7 h-7" />
                </div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-white/50 text-sm uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* History & Philosophy Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {/* History */}
          <motion.div
            {...fadeInUp}
            transition={{ delay: 0.3 }}
            className="gradient-border p-8 group"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="icon-circle icon-circle-md icon-circle-gold group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white">Our History</h3>
            </div>
            <p className="text-white/60 leading-relaxed mb-4">
              Founded with a vision to provide quality education rooted in Christian values,
              Jesus Junior Academy has been nurturing young minds and building strong character
              for years. Located in the heart of Rewari, near SBI Bank at Church House, we serve
              as a beacon of educational excellence in the community.
            </p>
            <p className="text-white/60 leading-relaxed">
              Our institution stands on the foundation of truth, integrity, and academic excellence,
              preparing students not just for examinations but for life itself.
            </p>
          </motion.div>

          {/* Philosophy */}
          <motion.div
            {...fadeInUp}
            transition={{ delay: 0.4 }}
            className="gradient-border p-8 group"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="icon-circle icon-circle-md icon-circle-accent group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white">Educational Philosophy</h3>
            </div>
            <p className="text-white/60 leading-relaxed mb-4">
              We believe education is more than memorizing facts. It's about developing critical
              thinking, moral values, and a lifelong love for learning. Our curriculum balances
              academic rigor with character development.
            </p>
            <p className="text-white/60 leading-relaxed">
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
                {...fadeInUp}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="glass-card p-8 text-center"
              >
                <div
                  className={`icon-circle icon-circle-lg mx-auto mb-6 ${isGold ? 'icon-circle-gold' : 'icon-circle-accent'
                    }`}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-bold text-white mb-4">{card.title}</h4>
                <p className="text-white/60 leading-relaxed text-sm">{card.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
