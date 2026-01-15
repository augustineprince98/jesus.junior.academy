'use client';

/**
 * Activities & Celebrations Section
 *
 * Clean design showcasing school events.
 * Connects to backend events API.
 */

import { Calendar, Users, PartyPopper, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { eventsApi } from '@/lib/api';

interface Event {
  id: number;
  title: string;
  description: string;
  event_type: string;
  date: string;
  image_url?: string;
  audience_students: boolean;
  audience_parents: boolean;
  audience_teachers: boolean;
}

export default function ActivitiesSection() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await eventsApi.getPublic();
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'celebration':
        return <PartyPopper className="w-5 h-5" />;
      case 'sports':
        return <Users className="w-5 h-5" />;
      case 'cultural':
        return <Sparkles className="w-5 h-5" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'celebration':
        return 'bg-pink-500';
      case 'sports':
        return 'bg-green-500';
      case 'cultural':
        return 'bg-purple-500';
      case 'academic':
        return 'bg-blue-500';
      default:
        return 'bg-orange-500';
    }
  };

  return (
    <section id="activities" className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
            School Celebrations
          </h2>
          <div className="w-20 h-1 bg-blue-900 mx-auto mb-4" />
          <p className="text-gray-600 max-w-2xl mx-auto">
            Festivals, events, and special moments at our school
          </p>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-900 rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">
              Upcoming events will be displayed here soon!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
              >
                {/* Color Bar */}
                <div className={`h-2 ${getEventColor(event.event_type)}`} />

                {/* Content */}
                <div className="p-6">
                  {/* Event Type & Date */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                      {getEventIcon(event.event_type)}
                      {event.event_type}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(event.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-800 mb-3">
                    {event.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed mb-4 line-clamp-3">
                    {event.description}
                  </p>

                  {/* Audience Tags */}
                  <div className="flex flex-wrap gap-2">
                    {event.audience_students && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        Students
                      </span>
                    )}
                    {event.audience_parents && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                        Parents
                      </span>
                    )}
                    {event.audience_teachers && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                        Teachers
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
