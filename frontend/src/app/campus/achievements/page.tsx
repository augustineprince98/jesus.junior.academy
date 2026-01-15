'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import { achievementsApi } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Trophy,
  Star,
  Calendar,
  User,
  Award,
  Medal,
  Target,
} from 'lucide-react';

interface Achievement {
  id: number;
  title: string;
  description: string;
  category: string;
  achievement_date: string;
  student_name: string | null;
  student_class: string | null;
  image_url: string | null;
  is_featured: boolean;
}

export default function AchievementsPage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuthStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadAchievements();
  }, [isAuthenticated, router]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await achievementsApi.getPublic(undefined, false, 50);
      setAchievements((data as any).achievements || []);
    } catch (err: any) {
      setError('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      ACADEMIC: Target,
      SPORTS: Medal,
      ARTS: Star,
      SCIENCE: Award,
      LEADERSHIP: Trophy,
    };
    const Icon = icons[category] || Trophy;
    return <Icon className="w-5 h-5" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      ACADEMIC: 'bg-blue-100 text-blue-700',
      SPORTS: 'bg-green-100 text-green-700',
      ARTS: 'bg-purple-100 text-purple-700',
      SCIENCE: 'bg-cyan-100 text-cyan-700',
      LEADERSHIP: 'bg-yellow-100 text-yellow-700',
      COMMUNITY: 'bg-pink-100 text-pink-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const categories = ['all', ...Array.from(new Set(achievements.map(a => a.category)))];

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const featuredAchievements = achievements.filter(a => a.is_featured);

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-yellow-50 to-amber-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/campus')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Achievements</h1>
                <p className="text-xs text-gray-500">Our proud moments</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Banner */}
        {featuredAchievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-yellow-500 to-amber-600 rounded-2xl p-6 mb-8 text-white"
          >
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 fill-white" />
              <span className="font-semibold">Featured Achievement</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">{featuredAchievements[0].title}</h2>
            <p className="opacity-90 mb-4">{featuredAchievements[0].description}</p>
            {featuredAchievements[0].student_name && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4" />
                <span>{featuredAchievements[0].student_name}</span>
                {featuredAchievements[0].student_class && (
                  <span className="opacity-75">| {featuredAchievements[0].student_class}</span>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {category === 'all' ? 'All' : category.charAt(0) + category.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadAchievements}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : filteredAchievements.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No achievements found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                {achievement.image_url && (
                  <div className="h-48 bg-gray-200">
                    <img
                      src={achievement.image_url}
                      alt={achievement.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getCategoryColor(achievement.category)}`}>
                      {getCategoryIcon(achievement.category)}
                      {achievement.category}
                    </span>
                    {achievement.is_featured && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2">{achievement.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{achievement.description}</p>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    {achievement.student_name ? (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{achievement.student_name}</span>
                      </div>
                    ) : (
                      <div></div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(achievement.achievement_date)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
