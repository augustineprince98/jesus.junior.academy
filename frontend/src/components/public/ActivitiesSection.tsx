'use client';

/**
 * Activities & Celebrations Section - Premium Design
 *
 * Elegant showcase of school events with
 * refined cards, animations, and visual hierarchy.
 */

import Link from 'next/link';
import { Calendar, Users, PartyPopper, Sparkles, ArrowRight, CalendarDays } from 'lucide-react';
import { useEffect, useState } from 'react';
import { eventsApi } from '@/lib/api';
import { motion } from 'framer-motion';

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
  is_featured?: boolean;
}

export default function ActivitiesSection() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await eventsApi.getPublic(undefined, true, 6, true);
      setEvents(data as Event[]);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'celebration':
        return <PartyPopper className="w-4 h-4" />;
      case 'sports':
        return <Users className="w-4 h-4" />;
      case 'cultural':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getEventStyles = (type: string) => {
    switch (type.toLowerCase()) {
      case 'celebration':
        return {
          gradient: 'from-pink-500 to-rose-500',
          badge: 'bg-pink-100 text-pink-700',
          light: 'bg-pink-50',
        };
      case 'sports':
        return {
          gradient: 'from-emerald-500 to-green-500',
          badge: 'bg-emerald-100 text-emerald-700',
          light: 'bg-emerald-50',
        };
      case 'cultural':
        return {
          gradient: 'from-purple-500 to-violet-500',
          badge: 'bg-purple-100 text-purple-700',
          light: 'bg-purple-50',
        };
      case 'academic':
        return {
          gradient: 'from-blue-500 to-indigo-500',
          badge: 'bg-blue-100 text-blue-700',
          light: 'bg-blue-50',
        };
      default:
        return {
          gradient: 'from-orange-500 to-amber-500',
          badge: 'bg-orange-100 text-orange-700',
          light: 'bg-orange-50',
        };
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-50px' },
  };

  return (
    <section id="activities" className="py-20 md:py-28 section-subtle relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-purple-100 to-transparent rounded-full opacity-50 blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-bl from-pink-100 to-transparent rounded-full opacity-50 blur-3xl" />

      <div className="max-w-6xl mx-auto px-6 relative">
        {/* Section Header */}
        <motion.div {...fadeInUp} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold mb-6">
            <PartyPopper className="w-4 h-4" />
            School Life
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Celebrations & <span className="text-purple-700">Events</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Festivals, events, and special moments that make our school vibrant
          </p>
        </motion.div>

        {/* View All Link */}
        {events.length > 0 && (
          <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="flex justify-end mb-8">
            <Link
              href="/celebrations"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-full font-semibold transition-all group"
            >
              View All Events
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        )}

        {/* Events Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="loading-spinner w-12 h-12" />
          </div>
        ) : events.length === 0 ? (
          <motion.div {...fadeInUp} className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CalendarDays className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-xl text-gray-500 font-medium">
              Upcoming events will be displayed here soon!
            </p>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => {
              const styles = getEventStyles(event.event_type);

              return (
                <motion.div
                  key={event.id}
                  {...fadeInUp}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
                >
                  {/* Gradient Bar */}
                  <div className={`h-1.5 bg-gradient-to-r ${styles.gradient}`} />

                  {/* Content */}
                  <div className="p-6">
                    {/* Event Type & Date */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${styles.badge} rounded-full text-xs font-semibold`}
                      >
                        {getEventIcon(event.event_type)}
                        {event.event_type}
                      </span>
                      <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(event.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-purple-700 transition-colors line-clamp-2">
                      {event.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">
                      {event.description}
                    </p>

                    {/* Audience Tags */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                      {event.audience_students && (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                          Students
                        </span>
                      )}
                      {event.audience_parents && (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                          Parents
                        </span>
                      )}
                      {event.audience_teachers && (
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
                          Teachers
                        </span>
                      )}
                    </div>
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
