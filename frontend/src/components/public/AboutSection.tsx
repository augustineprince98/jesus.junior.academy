'use client';

/**
 * About the School Section - Premium Design
 *
 * Clean design with animated cards, refined typography,
 * and elegant visual hierarchy.
 */

import { BookOpen, Target, Heart, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AboutSection() {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-50px' },
    transition: { duration: 0.6 },
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
      color: 'emerald',
    },
    {
      icon: Heart,
      title: 'Our Values',
      description:
        'Truth, integrity, compassion, excellence, and service. These core values guide everything we do and shape the character of our students.',
      color: 'rose',
    },
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-100 text-blue-900',
      hover: 'hover:border-blue-200',
    },
    emerald: {
      bg: 'bg-emerald-50',
      icon: 'bg-emerald-100 text-emerald-700',
      hover: 'hover:border-emerald-200',
    },
    rose: {
      bg: 'bg-rose-50',
      icon: 'bg-rose-100 text-rose-700',
      hover: 'hover:border-rose-200',
    },
  };

  return (
    <section id="about" className="section-subtle py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <motion.div {...fadeInUp} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-900 rounded-full text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            About Our School
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Excellence in Education,
            <br />
            <span className="text-blue-900">Rooted in Values</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-900 to-blue-600 mx-auto rounded-full" />
        </motion.div>

        {/* Main Description */}
        <motion.div
          {...fadeInUp}
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto text-center mb-20"
        >
          <p className="text-gray-600 leading-relaxed text-lg md:text-xl">
            Jesus Junior Academy is committed to nurturing young minds through quality education,
            strong moral values, and a disciplined learning environment. We believe in holistic
            development through academics and co-curricular activities.
          </p>
        </motion.div>

        {/* History & Philosophy Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {/* History */}
          <motion.div
            {...fadeInUp}
            transition={{ delay: 0.2 }}
            className="card-premium group"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-amber-700" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Our History</h3>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              Founded with a vision to provide quality education rooted in Christian values,
              Jesus Junior Academy has been nurturing young minds and building strong character
              for years. Located in the heart of Rewari, near SBI Bank at Church House, we serve
              as a beacon of educational excellence in the community.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our institution stands on the foundation of truth, integrity, and academic excellence,
              preparing students not just for examinations but for life itself.
            </p>
          </motion.div>

          {/* Philosophy */}
          <motion.div
            {...fadeInUp}
            transition={{ delay: 0.3 }}
            className="card-premium group"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-purple-700" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Educational Philosophy</h3>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              We believe education is more than memorizing facts. It's about developing critical
              thinking, moral values, and a lifelong love for learning. Our curriculum balances
              academic rigor with character development, ensuring students grow into responsible
              citizens.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Every child is unique, and we strive to unlock their potential through personalized
              attention, innovative teaching methods, and a nurturing environment.
            </p>
          </motion.div>
        </div>

        {/* Vision, Mission, Values Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card, index) => {
            const colors = colorClasses[card.color as keyof typeof colorClasses];
            const Icon = card.icon;

            return (
              <motion.div
                key={card.title}
                {...fadeInUp}
                transition={{ delay: 0.4 + index * 0.1 }}
                className={`bg-white border border-gray-100 rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-card-hover ${colors.hover}`}
              >
                <div
                  className={`w-16 h-16 ${colors.icon} rounded-2xl flex items-center justify-center mx-auto mb-6 transition-transform hover:scale-110`}
                >
                  <Icon className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">{card.title}</h4>
                <p className="text-gray-600 leading-relaxed">{card.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
