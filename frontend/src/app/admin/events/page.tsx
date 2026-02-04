'use client';

/**
 * Events Management - Admin Panel
 *
 * Create, edit, delete, and manage school events
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import AdminLayout from '@/components/admin/AdminLayout';
import { eventsApi } from '@/lib/api';
import { API_BASE_URL } from '@/lib/runtime-config';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  X,
  Save,
  Calendar,
  MapPin,
  Upload,
  Image,
} from 'lucide-react';

interface Event {
  id: number;
  title: string;
  description: string;
  event_type: string;
  event_date: string;
  venue?: string;
  image_url?: string;
  is_featured: boolean;
  is_public: boolean;
  for_students: boolean;
  for_parents: boolean;
  for_teachers: boolean;
}

const EVENT_TYPES = [
  { value: 'CELEBRATION', label: 'Celebration', description: 'Diwali, Christmas, etc.' },
  { value: 'SPORTS', label: 'Sports', description: 'Sports day, competitions' },
  { value: 'CULTURAL', label: 'Cultural', description: 'Annual day, dance, music' },
  { value: 'ACADEMIC', label: 'Academic', description: 'Science fair, exhibitions' },
  { value: 'HOLIDAY', label: 'Holiday', description: 'Public holidays' },
  { value: 'MEETING', label: 'Meeting', description: 'PTM, staff meetings' },
  { value: 'OTHER', label: 'Other', description: 'Other events' },
];

export default function EventsPage() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'CELEBRATION',
    event_date: new Date().toISOString().split('T')[0],
    venue: '',
    image_url: '',
    is_featured: false,
    is_public: true,
    for_students: true,
    for_parents: true,
    for_teachers: true,
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
      const eventsData = await eventsApi.list(token!);
      setEvents(eventsData as Event[]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', 'events');

        const response = await fetch(
          `${API_BASE_URL}/uploads/image`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (response.ok) {
          const data = await response.json();
          newImages.push(data.file_path);
        }
      }

      setUploadedImages((prev) => [...prev, ...newImages]);
      if (newImages.length > 0) {
        setFormData((prev) => ({ ...prev, image_url: newImages[0] }));
      }
    } catch (error) {
      console.error('Failed to upload images:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await eventsApi.update(token!, editingId, formData);
      } else {
        await eventsApi.create(token!, formData);
      }
      closeModal();
      loadData();
    } catch (error) {
      console.error('Failed to save event:', error);
      alert('Failed to save event. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await eventsApi.delete(token!, id);
      loadData();
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event. Please try again.');
    }
  };

  const handleEdit = (event: Event) => {
    setEditingId(event.id);
    setFormData({
      title: event.title,
      description: event.description,
      event_type: event.event_type,
      event_date: event.event_date,
      venue: event.venue || '',
      image_url: event.image_url || '',
      is_featured: event.is_featured,
      is_public: event.is_public,
      for_students: event.for_students,
      for_parents: event.for_parents,
      for_teachers: event.for_teachers,
    });
    setUploadedImages(event.image_url ? [event.image_url] : []);
    setShowModal(true);
  };

  const togglePublic = async (event: Event) => {
    try {
      await eventsApi.update(token!, event.id, {
        is_public: !event.is_public,
      });
      loadData();
    } catch (error) {
      console.error('Failed to toggle public status:', error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setUploadedImages([]);
    setFormData({
      title: '',
      description: '',
      event_type: 'CELEBRATION',
      event_date: new Date().toISOString().split('T')[0],
      venue: '',
      image_url: '',
      is_featured: false,
      is_public: true,
      for_students: true,
      for_parents: true,
      for_teachers: true,
    });
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'CELEBRATION':
        return 'bg-pink-100 text-pink-700';
      case 'SPORTS':
        return 'bg-green-100 text-green-700';
      case 'CULTURAL':
        return 'bg-purple-100 text-purple-700';
      case 'ACADEMIC':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <AdminLayout activeSection="events">
      <div className="max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Events Management</h1>
            <p className="text-gray-600">Manage school events and activities</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add Event
          </button>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-md">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Events Yet</h3>
            <p className="text-gray-500 mb-6">Start adding events to keep everyone informed!</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              Add First Event
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{event.title}</h3>
                      {event.is_featured && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" fill="currentColor" />
                          Featured
                        </span>
                      )}
                      {!event.is_public && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                          Private
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 mb-4">{event.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getEventColor(event.event_type)}`}>
                        {EVENT_TYPES.find(t => t.value === event.event_type)?.label || event.event_type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(event.event_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                      {event.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.venue}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3">
                      {event.for_students && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">Students</span>
                      )}
                      {event.for_parents && (
                        <span className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded-full">Parents</span>
                      )}
                      {event.for_teachers && (
                        <span className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full">Teachers</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => togglePublic(event)}
                      className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      title={event.is_public ? 'Make private' : 'Make public'}
                    >
                      {event.is_public ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleEdit(event)}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
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
                  {editingId ? 'Edit Event' : 'Add New Event'}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Event Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., Annual Sports Day 2026"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    placeholder="Describe the event..."
                  />
                </div>

                {/* Event Type & Date */}
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Event Type *</label>
                    <select
                      value={formData.event_type}
                      onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {EVENT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label} - {type.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Event Date *</label>
                    <input
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Venue */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Venue</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="School Ground"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Event Images</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={uploading}
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      {uploading ? (
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-2" />
                          <span className="text-gray-500">Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="w-10 h-10 text-gray-400 mb-2" />
                          <span className="text-gray-600 font-medium">Click to upload images</span>
                          <span className="text-gray-400 text-sm mt-1">PNG, JPG, GIF up to 5MB each</span>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Preview uploaded images */}
                  {uploadedImages.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {uploadedImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={`${API_BASE_URL}${img}`}
                            alt={`Upload ${idx + 1}`}
                            className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedImages((prev) => prev.filter((_, i) => i !== idx));
                              if (formData.image_url === img) {
                                setFormData((prev) => ({ ...prev, image_url: uploadedImages[0] || '' }));
                              }
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Audience */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Target Audience</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.for_students}
                        onChange={(e) => setFormData({ ...formData, for_students: e.target.checked })}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Students</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.for_parents}
                        onChange={(e) => setFormData({ ...formData, for_parents: e.target.checked })}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Parents</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.for_teachers}
                        onChange={(e) => setFormData({ ...formData, for_teachers: e.target.checked })}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Teachers</span>
                    </label>
                  </div>
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
                    <span className="text-sm font-medium text-gray-700">Make public (visible on homepage)</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Mark as featured (priority display)</span>
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
                    {editingId ? 'Update' : 'Create'} Event
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
