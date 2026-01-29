'use client';

/**
 * Activities & Celebrations Section - Igloo-Inspired Design
 *
 * Dark elegant showcase with glass cards,
 * gradient accents, and smooth animations.
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

  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-100px' },
  };

  return (
    <section id="activities" className="section-elevated py-24 md:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="glow-orb glow-orb-blue w-[350px] h-[350px] top-20 left-0 opacity-20" />
      <div className="glow-orb glow-orb-gold w-[250px] h-[250px] bottom-20 right-10 opacity-15" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div {...fadeInUp} className="text-center mb-16">
          <span className="badge badge-accent text-sm mb-6">
            <PartyPopper className="w-4 h-4 mr-2" />
            School Life
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Celebrations & <span className="text-gradient-accent">Events</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-lg">
            Festivals, events, and special moments that make our school vibrant
          </p>
        </motion.div>

        {/* View All Link */}
        {events.length > 0 && (
          <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="flex justify-end mb-8">
            <Link
              href="/celebrations"
              className="btn btn-secondary text-sm flex items-center gap-2 group"
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
            <div className="icon-circle icon-circle-lg icon-circle-accent mx-auto mb-6">
              <CalendarDays className="w-8 h-8" />
            </div>
            <p className="text-xl text-white/50 font-medium">
              Upcoming events will be displayed here soon!
            </p>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                {...fadeInUp}
                transition={{ delay: 0.1 + index * 0.1, duration: 0.6 }}
                className="glass-card overflow-hidden group"
              >
                {/* Gradient Bar */}
                <div className="h-1 bg-gradient-to-r from-[#6691E5] to-[#F5D76E]" />

                {/* Content */}
                <div className="p-6">
                  {/* Event Type & Date */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="badge badge-accent text-xs">
                      {getEventIcon(event.event_type)}
                      <span className="ml-1.5">{event.event_type}</span>
                    </span>
                    <span className="text-xs text-white/40 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(event.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-white mb-3 group-hover:text-[#6691E5] transition-colors line-clamp-2">
                    {event.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-white/50 leading-relaxed mb-4 line-clamp-3">
                    {event.description}
                  </p>

                  {/* Audience Tags */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
                    {event.audience_students && (
                      <span className="px-2.5 py-1 bg-[#6691E5]/15 text-[#6691E5] text-xs font-medium rounded-full border border-[#6691E5]/30">
                        Students
                      </span>
                    )}
                    {event.audience_parents && (
                      <span className="px-2.5 py-1 bg-[#F5D76E]/15 text-[#F5D76E] text-xs font-medium rounded-full border border-[#F5D76E]/30">
                        Parents
                      </span>
                    )}
                    {event.audience_teachers && (
                      <span className="px-2.5 py-1 bg-white/10 text-white/70 text-xs font-medium rounded-full border border-white/20">
                        Teachers
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
