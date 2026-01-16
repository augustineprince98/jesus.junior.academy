'use client';

/**
 * Achievers Club Section
 *
 * Clean design showcasing featured student achievements.
 * Connects to backend achievements API.
 * Shows only featured items with "View All" link.
 */

import Link from 'next/link';
import { Trophy, Award, Star, Medal, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { achievementsApi } from '@/lib/api';

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
      // Load only featured achievements for homepage (limit to 6)
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
        return <Star className="w-5 h-5" />;
      case 'sports':
        return <Trophy className="w-5 h-5" />;
      case 'arts':
      case 'cultural':
        return <Award className="w-5 h-5" />;
      default:
        return <Medal className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'academic':
        return 'bg-yellow-100 text-yellow-700';
      case 'sports':
        return 'bg-green-100 text-green-700';
      case 'arts':
      case 'cultural':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <section id="achievers" className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
            Achievers' Club
          </h2>
          <div className="w-20 h-1 bg-blue-900 mx-auto mb-4" />
          <p className="text-gray-600 max-w-2xl mx-auto">
            Students excelling in academics and co-curricular activities
          </p>
        </div>

        {/* View All Link - Top Right */}
        {achievements.length > 0 && (
          <div className="flex justify-end mb-6">
            <Link
              href="/achievers"
              className="inline-flex items-center gap-2 text-blue-900 hover:text-blue-700 font-semibold transition-colors"
            >
              View All Achievements
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Achievements Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-900 rounded-full animate-spin" />
          </div>
        ) : achievements.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">
              Achievements will be showcased here soon!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                {/* Category Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(achievement.category)}`}>
                    {getCategoryIcon(achievement.category)}
                    {achievement.category}
                  </span>
                  <span className="text-sm text-gray-400">
                    {new Date(achievement.date).toLocaleDateString('en-IN', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Student Name */}
                <h3 className="text-xl font-bold text-blue-900 mb-2">
                  {achievement.student_name}
                </h3>

                {/* Achievement Title */}
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  {achievement.title}
                </h4>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed">
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
