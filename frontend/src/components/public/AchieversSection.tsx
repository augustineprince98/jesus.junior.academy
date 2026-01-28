'use client';

/**
 * Achievers Club Section - Premium Design
 *
 * Elegant showcase of student achievements with
 * animations, refined cards, and visual hierarchy.
 */

import Link from 'next/link';
import { Trophy, Award, Star, Medal, ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { achievementsApi } from '@/lib/api';
import { motion } from 'framer-motion';

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

  const getCategoryStyles = (category: string) => {
    switch (category.toLowerCase()) {
      case 'academic':
        return {
          badge: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-200',
          icon: 'bg-amber-500',
        };
      case 'sports':
        return {
          badge: 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-200',
          icon: 'bg-emerald-500',
        };
      case 'arts':
      case 'cultural':
        return {
          badge: 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border-purple-200',
          icon: 'bg-purple-500',
        };
      default:
        return {
          badge: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200',
          icon: 'bg-blue-500',
        };
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-50px' },
  };

  return (
    <section id="achievers" className="py-20 md:py-28 bg-white relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-50 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-6xl mx-auto px-6 relative">
        {/* Section Header */}
        <motion.div {...fadeInUp} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold mb-6">
            <Trophy className="w-4 h-4" />
            Student Excellence
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Achievers' <span className="text-gradient-gold">Club</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Celebrating students who excel in academics and co-curricular activities
          </p>
        </motion.div>

        {/* View All Link */}
        {achievements.length > 0 && (
          <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="flex justify-end mb-8">
            <Link
              href="/achievers"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-full font-semibold transition-all group"
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
          <motion.div {...fadeInUp} className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-xl text-gray-500 font-medium">
              Achievements will be showcased here soon!
            </p>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement, index) => {
              const styles = getCategoryStyles(achievement.category);

              return (
                <motion.div
                  key={achievement.id}
                  {...fadeInUp}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className="group bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:border-amber-200 transition-all duration-300"
                >
                  {/* Category Badge & Date */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${styles.badge}`}
                    >
                      {getCategoryIcon(achievement.category)}
                      {achievement.category}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {new Date(achievement.date).toLocaleDateString('en-IN', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Student Avatar & Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-10 h-10 ${styles.icon} rounded-full flex items-center justify-center text-white font-bold text-sm`}
                    >
                      {achievement.student_name.charAt(0)}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-amber-700 transition-colors">
                      {achievement.student_name}
                    </h3>
                  </div>

                  {/* Achievement Title */}
                  <h4 className="text-base font-semibold text-gray-800 mb-3 line-clamp-2">
                    {achievement.title}
                  </h4>

                  {/* Description */}
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                    {achievement.description}
                  </p>

                  {/* Hover Indicator */}
                  <div className="mt-4 pt-4 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
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
