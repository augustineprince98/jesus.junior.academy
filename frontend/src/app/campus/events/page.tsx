'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import { eventsApi } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronRight,
  Star,
} from 'lucide-react';

interface Event {
  id: number;
  title: string;
  description: string;
  event_type: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  image_url: string | null;
  is_featured: boolean;
  for_students: boolean;
  for_parents: boolean;
  for_teachers: boolean;
}

export default function EventsPage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadEvents();
  }, [isAuthenticated, router, token]);

  const loadEvents = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const data = await eventsApi.getUpcoming(token, 90);
      setEvents((data as any).events || []);
    } catch (err: any) {
      // Fallback to public API
      try {
        const publicData = await eventsApi.getPublic(undefined, true, 50);
        setEvents((publicData as any).events || []);
      } catch {
        setError('Failed to load events');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('en-IN', { month: 'short' }),
      year: date.getFullYear(),
      weekday: date.toLocaleDateString('en-IN', { weekday: 'long' }),
    };
  };

  const formatTime = (time: string | null) => {
    if (!time) return '';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      CELEBRATION: 'bg-pink-100 text-pink-700',
      SPORTS: 'bg-green-100 text-green-700',
      CULTURAL: 'bg-purple-100 text-purple-700',
      ACADEMIC: 'bg-blue-100 text-blue-700',
      HOLIDAY: 'bg-yellow-100 text-yellow-700',
      MEETING: 'bg-gray-100 text-gray-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const eventTypes = ['all', ...Array.from(new Set(events.map(e => e.event_type)))];

  const filteredEvents = selectedType === 'all'
    ? events
    : events.filter(e => e.event_type === selectedType);

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-violet-50 to-purple-50">
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
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Events & Activities</h1>
                <p className="text-xs text-gray-500">Upcoming school events</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {eventTypes.map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedType === type
                  ? 'bg-violet-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {type === 'all' ? 'All Events' : type.charAt(0) + type.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadEvents}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event, index) => {
              const date = formatDate(event.event_date);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex">
                    {/* Date Column */}
                    <div className="w-24 bg-gradient-to-br from-violet-500 to-purple-600 flex flex-col items-center justify-center text-white p-4">
                      <span className="text-3xl font-bold">{date.day}</span>
                      <span className="text-sm uppercase">{date.month}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.event_type)}`}>
                              {event.event_type}
                            </span>
                            {event.is_featured && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{event.description}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>

                      <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{date.weekday}</span>
                        </div>
                        {event.start_time && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              {formatTime(event.start_time)}
                              {event.end_time && ` - ${formatTime(event.end_time)}`}
                            </span>
                          </div>
                        )}
                        {event.venue && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{event.venue}</span>
                          </div>
                        )}
                      </div>

                      {/* Audience Tags */}
                      <div className="flex items-center gap-2 mt-4">
                        <Users className="w-4 h-4 text-gray-400" />
                        <div className="flex gap-1">
                          {event.for_students && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">Students</span>
                          )}
                          {event.for_parents && (
                            <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded">Parents</span>
                          )}
                          {event.for_teachers && (
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded">Teachers</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
