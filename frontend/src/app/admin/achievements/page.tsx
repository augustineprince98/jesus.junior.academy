'use client';

/**
 * Achievements Management - Admin Panel
 *
 * Create, edit, delete, and manage achievements for the Achievers Club
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import AdminLayout from '@/components/admin/AdminLayout';
import { achievementsApi } from '@/lib/api';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  X,
  Save,
  Trophy,
  Award,
  Medal,
  Sparkles,
} from 'lucide-react';

interface Achievement {
  id: number;
  student_id?: number;
  title: string;
  description: string;
  category: string;
  achievement_date: string;
  image_url?: string;
  is_featured: boolean;
  is_public: boolean;
  display_order: number;
}

export default function AchievementsPage() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuthStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'ACADEMIC',
    achievement_date: new Date().toISOString().split('T')[0],
    image_url: '',
    is_featured: false,
    is_public: true,
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    loadData();
  }, [isAuthenticated, user, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [achievementsData, categoriesData] = await Promise.all([
        achievementsApi.list(token!),
        achievementsApi.getCategories(),
      ]);
      setAchievements(achievementsData as Achievement[]);
      setCategories(categoriesData.categories);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await achievementsApi.update(token!, editingId, formData);
      } else {
        await achievementsApi.create(token!, formData);
      }
      closeModal();
      loadData();
    } catch (error) {
      console.error('Failed to save achievement:', error);
      alert('Failed to save achievement. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this achievement?')) return;

    try {
      await achievementsApi.delete(token!, id);
      loadData();
    } catch (error) {
      console.error('Failed to delete achievement:', error);
      alert('Failed to delete achievement. Please try again.');
    }
  };

  const handleEdit = (achievement: Achievement) => {
    setEditingId(achievement.id);
    setFormData({
      title: achievement.title,
      description: achievement.description,
      category: achievement.category,
      achievement_date: achievement.achievement_date,
      image_url: achievement.image_url || '',
      is_featured: achievement.is_featured,
      is_public: achievement.is_public,
    });
    setShowModal(true);
  };

  const togglePublic = async (achievement: Achievement) => {
    try {
      await achievementsApi.update(token!, achievement.id, {
        is_public: !achievement.is_public,
      });
      loadData();
    } catch (error) {
      console.error('Failed to toggle public status:', error);
    }
  };

  const toggleFeatured = async (achievement: Achievement) => {
    try {
      await achievementsApi.update(token!, achievement.id, {
        is_featured: !achievement.is_featured,
      });
      loadData();
    } catch (error) {
      console.error('Failed to toggle featured status:', error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      category: 'ACADEMIC',
      achievement_date: new Date().toISOString().split('T')[0],
      image_url: '',
      is_featured: false,
      is_public: true,
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ACADEMIC':
        return <Award className="w-5 h-5" />;
      case 'SPORTS':
        return <Trophy className="w-5 h-5" />;
      case 'ARTS':
      case 'CULTURAL':
        return <Sparkles className="w-5 h-5" />;
      default:
        return <Medal className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ACADEMIC':
        return 'bg-blue-100 text-blue-700';
      case 'SPORTS':
        return 'bg-green-100 text-green-700';
      case 'ARTS':
      case 'CULTURAL':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <AdminLayout activeSection="achievements">
      <div className="max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Achievements Management</h1>
            <p className="text-gray-600">Manage student achievements for the Achievers Club</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add Achievement
          </button>
        </div>

        {/* Achievements List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : achievements.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-md">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Achievements Yet</h3>
            <p className="text-gray-500 mb-6">Start adding achievements to showcase student success!</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              Add First Achievement
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Category Icon */}
                    <div className={`p-3 rounded-lg ${getCategoryColor(achievement.category)}`}>
                      {getCategoryIcon(achievement.category)}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{achievement.title}</h3>
                        {achievement.is_featured && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3" fill="currentColor" />
                            Featured
                          </span>
                        )}
                        {!achievement.is_public && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                            Private
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{achievement.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoryColor(achievement.category)}`}>
                          {achievement.category}
                        </span>
                        <span>{new Date(achievement.achievement_date).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFeatured(achievement)}
                      className={`p-2 rounded-lg transition-colors ${
                        achievement.is_featured
                          ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                      title={achievement.is_featured ? 'Remove from featured' : 'Mark as featured'}
                    >
                      <Star className="w-5 h-5" fill={achievement.is_featured ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => togglePublic(achievement)}
                      className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      title={achievement.is_public ? 'Make private' : 'Make public'}
                    >
                      {achievement.is_public ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleEdit(achievement)}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(achievement.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingId ? 'Edit Achievement' : 'Add New Achievement'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Achievement Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., First Prize in Science Olympiad"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    placeholder="Describe the achievement..."
                  />
                </div>

                {/* Category & Date */}
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Achievement Date *
                    </label>
                    <input
                      type="date"
                      value={formData.achievement_date}
                      onChange={(e) => setFormData({ ...formData, achievement_date: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_public}
                      onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Make public (visible on homepage)
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Mark as featured (priority display)
                    </span>
                  </label>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {editingId ? 'Update' : 'Create'} Achievement
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
