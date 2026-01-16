'use client';

/**
 * Public Celebrations/Events Page
 *
 * Full page showcasing all school events and celebrations.
 * Accessible without login.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import { eventsApi } from '@/lib/api';
import {
  Calendar,
  PartyPopper,
  Users,
  Sparkles,
  Trophy,
  BookOpen,
  Star,
  ArrowLeft,
  Filter,
  MapPin,
  Image as ImageIcon,
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
  for_students: boolean;
  for_parents: boolean;
  for_teachers: boolean;
}

const EVENT_TYPES = [
  { value: '', label: 'All Events' },
  { value: 'CELEBRATION', label: 'Celebrations' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'CULTURAL', label: 'Cultural' },
  { value: 'ACADEMIC', label: 'Academic' },
  { value: 'HOLIDAY', label: 'Holidays' },
  { value: 'MEETING', label: 'Meetings' },
  { value: 'OTHER', label: 'Other' },
];

export default function CelebrationsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    loadEvents();
  }, [selectedType]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventsApi.getPublic(
        selectedType || undefined,
        false,
        100
      );
      setEvents(data as Event[]);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'CELEBRATION':
        return <PartyPopper className="w-5 h-5" />;
      case 'SPORTS':
        return <Trophy className="w-5 h-5" />;
      case 'CULTURAL':
        return <Sparkles className="w-5 h-5" />;
      case 'ACADEMIC':
        return <BookOpen className="w-5 h-5" />;
      case 'MEETING':
        return <Users className="w-5 h-5" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'CELEBRATION':
        return 'from-pink-500 to-rose-500';
      case 'SPORTS':
        return 'from-green-500 to-emerald-500';
      case 'CULTURAL':
        return 'from-purple-500 to-violet-500';
      case 'ACADEMIC':
        return 'from-blue-500 to-indigo-500';
      case 'HOLIDAY':
        return 'from-orange-500 to-amber-500';
      case 'MEETING':
        return 'from-gray-500 to-slate-500';
      default:
        return 'from-cyan-500 to-teal-500';
    }
  };

  const getEventBadgeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'CELEBRATION':
        return 'bg-pink-100 text-pink-700';
      case 'SPORTS':
        return 'bg-green-100 text-green-700';
      case 'CULTURAL':
        return 'bg-purple-100 text-purple-700';
      case 'ACADEMIC':
        return 'bg-blue-100 text-blue-700';
      case 'HOLIDAY':
        return 'bg-orange-100 text-orange-700';
      case 'MEETING':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-cyan-100 text-cyan-700';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('en-IN', { month: 'short' }),
      year: date.getFullYear(),
      full: date.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    };
  };

  const isUpcoming = (dateStr: string) => {
    return new Date(dateStr) >= new Date(new Date().setHours(0, 0, 0, 0));
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-pink-700 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-purple-200 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">School Celebrations</h1>
          <p className="text-xl text-purple-100 max-w-2xl">
            Festivals, events, and special moments that make our school community vibrant!
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white border-b sticky top-[72px] z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {EVENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-500">
              {events.length} event{events.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-900 rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Events Found</h3>
            <p className="text-gray-500">
              {selectedType
                ? 'No events of this type yet.'
                : 'Events will be displayed here soon!'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const date = formatDate(event.event_date);
              const upcoming = isUpcoming(event.event_date);

              return (
                <div
                  key={event.id}
                  className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 ${
                    !upcoming ? 'opacity-75' : ''
                  }`}
                >
                  {/* Image or Gradient */}
                  {event.image_url ? (
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      {/* Date Badge on Image */}
                      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-2 text-center">
                        <div className="text-2xl font-bold text-gray-800">{date.day}</div>
                        <div className="text-xs text-gray-500 uppercase">{date.month}</div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`h-48 bg-gradient-to-br ${getEventColor(
                        event.event_type
                      )} flex items-center justify-center relative`}
                    >
                      <PartyPopper className="w-20 h-20 text-white/30" />
                      {/* Date Badge */}
                      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-2 text-center">
                        <div className="text-2xl font-bold text-gray-800">{date.day}</div>
                        <div className="text-xs text-gray-500 uppercase">{date.month}</div>
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    {/* Type Badge & Featured */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getEventBadgeColor(
                          event.event_type
                        )}`}
                      >
                        {getEventIcon(event.event_type)}
                        {event.event_type}
                      </span>
                      {event.is_featured && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" fill="currentColor" />
                          Featured
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{event.title}</h3>

                    {/* Description */}
                    <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>

                    {/* Venue */}
                    {event.venue && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <MapPin className="w-4 h-4" />
                        {event.venue}
                      </div>
                    )}

                    {/* Audience Tags */}
                    <div className="flex flex-wrap gap-2">
                      {event.for_students && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded">
                          Students
                        </span>
                      )}
                      {event.for_parents && (
                        <span className="px-2 py-1 bg-green-50 text-green-600 text-xs font-medium rounded">
                          Parents
                        </span>
                      )}
                      {event.for_teachers && (
                        <span className="px-2 py-1 bg-purple-50 text-purple-600 text-xs font-medium rounded">
                          Teachers
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    {!upcoming && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-400 font-medium">Past Event</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
