'use client';

/**
 * Achievers Club Section - Igloo.inc Inspired
 *
 * Enhanced with scroll-driven parallax,
 * dramatic card entrances, and premium effects.
 */

import Link from 'next/link';
import { Trophy, Award, Star, Medal, ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { achievementsApi } from '@/lib/api';
import { motion, useScroll, useTransform } from 'framer-motion';

interface Achievement {
  id: number;
  student_name: string;
  category: string;
  title: string;
  description: string;
  date: string;
  image_url?: string;
  is_featured?: boolean;
}

export default function AchieversSection() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const headerY = useTransform(scrollYProgress, [0, 0.3], [80, 0]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const data = await achievementsApi.getPublic(undefined, true, 6);
      setAchievements(data as Achievement[]);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'academic':
        return <Star className="w-4 h-4" />;
      case 'sports':
        return <Trophy className="w-4 h-4" />;
      case 'arts':
      case 'cultural':
        return <Award className="w-4 h-4" />;
      default:
        return <Medal className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'academic':
        return 'gold';
      case 'sports':
        return 'blue';
      case 'arts':
      case 'cultural':
        return 'blue';
      default:
        return 'gold';
    }
  };

  return (
    <section id="achievers" ref={sectionRef} className="section-dark py-24 md:py-32 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-dots" />
      <div className="absolute top-0 left-0 right-0 section-divider-glow" />
      <div className="glow-orb glow-orb-gold w-[400px] h-[400px] top-0 right-0 opacity-20" />
      <div className="glow-orb glow-orb-blue w-[300px] h-[300px] bottom-0 left-0 opacity-20" />

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
            <Trophy className="w-4 h-4 mr-2" />
            Student Excellence
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] mb-6"
          >
            Achievers' <span className="text-gradient-gold">Club</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-[var(--text-secondary)] max-w-2xl mx-auto text-lg"
          >
            Celebrating students who excel in academics and co-curricular activities
          </motion.p>
        </motion.div>

        {/* View All Link */}
        {achievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex justify-end mb-8"
          >
            <Link
              href="/achievers"
              className="btn btn-secondary text-sm flex items-center gap-2 group"
            >
              View All Achievements
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        )}

        {/* Achievements Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="loading-spinner w-12 h-12" />
          </div>
        ) : achievements.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center py-20"
          >
            <div className="icon-circle icon-circle-lg icon-circle-gold mx-auto mb-6">
              <Trophy className="w-8 h-8" />
            </div>
            <p className="text-xl text-[var(--text-secondary)] font-medium">
              Achievements will be showcased here soon!
            </p>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement, index) => {
              const color = getCategoryColor(achievement.category);
              const isGold = color === 'gold';

              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 60, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{
                    delay: 0.1 + index * 0.12,
                    duration: 0.7,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="glass-card p-6 group"
                >
                  {/* Category Badge & Date */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`badge ${isGold ? 'badge-gold' : 'badge-accent'} text-xs`}>
                      {getCategoryIcon(achievement.category)}
                      <span className="ml-1.5">{achievement.category}</span>
                    </span>
                    <span className="text-xs text-[var(--text-secondary)] font-medium">
                      {new Date(achievement.date).toLocaleDateString('en-IN', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Student Avatar & Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isGold
                        ? 'bg-gradient-to-br from-[var(--accent-gold)] to-[#D4AF37] text-[#1A1A1A]'
                        : 'bg-gradient-to-br from-[var(--accent-blue)] to-[#4A7BD4] text-white'
                        }`}
                    >
                      {achievement.student_name.charAt(0)}
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors">
                      {achievement.student_name}
                    </h3>
                  </div>

                  {/* Achievement Title */}
                  <h4 className="text-base font-semibold text-[var(--text-primary)]/90 mb-3 line-clamp-2">
                    {achievement.title}
                  </h4>

                  {/* Description */}
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                    {achievement.description}
                  </p>

                  {/* Hover Indicator */}
                  <div className="mt-4 pt-4 border-t border-[var(--glass-border)] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-[var(--accent-gold)] font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Featured Achievement
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
