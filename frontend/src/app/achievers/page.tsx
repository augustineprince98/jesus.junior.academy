'use client';

/**
 * Public Achievers Page
 *
 * Full page showcasing all student achievements.
 * Accessible without login.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import { achievementsApi } from '@/lib/api';
import {
  Trophy,
  Award,
  Star,
  Medal,
  Sparkles,
  ArrowLeft,
  Filter,
  Calendar,
  Image as ImageIcon,
} from 'lucide-react';

interface Achievement {
  id: number;
  student_name?: string;
  title: string;
  description: string;
  category: string;
  achievement_date: string;
  image_url?: string;
  is_featured: boolean;
}

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'ACADEMIC', label: 'Academic' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'ARTS', label: 'Arts' },
  { value: 'CULTURAL', label: 'Cultural' },
  { value: 'SCIENCE', label: 'Science' },
  { value: 'LEADERSHIP', label: 'Leadership' },
  { value: 'COMMUNITY', label: 'Community' },
  { value: 'OTHER', label: 'Other' },
];

export default function AchieversPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    loadAchievements();
  }, [selectedCategory]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const data = await achievementsApi.getPublic(
        selectedCategory || undefined,
        false,
        100
      );
      setAchievements(data as Achievement[]);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toUpperCase()) {
      case 'ACADEMIC':
        return <Star className="w-5 h-5" />;
      case 'SPORTS':
        return <Trophy className="w-5 h-5" />;
      case 'ARTS':
      case 'CULTURAL':
        return <Sparkles className="w-5 h-5" />;
      case 'SCIENCE':
        return <Award className="w-5 h-5" />;
      default:
        return <Medal className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toUpperCase()) {
      case 'ACADEMIC':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'SPORTS':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'ARTS':
      case 'CULTURAL':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'SCIENCE':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'LEADERSHIP':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'COMMUNITY':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Achievers' Club</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Celebrating excellence in academics, sports, arts, and beyond. Our students shine bright!
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white border-b sticky top-[72px] z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-500">
              {achievements.length} achievement{achievements.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-900 rounded-full animate-spin" />
          </div>
        ) : achievements.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Achievements Found</h3>
            <p className="text-gray-500">
              {selectedCategory
                ? 'No achievements in this category yet.'
                : 'Achievements will be showcased here soon!'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
              >
                {/* Image */}
                {achievement.image_url ? (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={achievement.image_url}
                      alt={achievement.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                    <Trophy className="w-16 h-16 text-blue-200" />
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Category Badge & Featured */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(
                        achievement.category
                      )}`}
                    >
                      {getCategoryIcon(achievement.category)}
                      {achievement.category}
                    </span>
                    {achievement.is_featured && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" fill="currentColor" />
                        Featured
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{achievement.title}</h3>

                  {/* Student Name */}
                  {achievement.student_name && (
                    <p className="text-blue-600 font-semibold mb-2">{achievement.student_name}</p>
                  )}

                  {/* Description */}
                  <p className="text-gray-600 mb-4 line-clamp-3">{achievement.description}</p>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {new Date(achievement.achievement_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
