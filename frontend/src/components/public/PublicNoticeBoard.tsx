'use client';

/**
 * Public Notice Board - Premium Design
 *
 * Displays upcoming events and announcements with
 * elegant animations and refined styling.
 */

import { useState, useEffect } from 'react';
import { eventsApi } from '@/lib/api';
import { motion } from 'framer-motion';
import { Bell, Calendar, Pin, AlertCircle, ArrowRight } from 'lucide-react';

interface Notice {
    id: number;
    title: string;
    description: string;
    event_date: string;
    type: string;
    is_featured: boolean;
}

export default function PublicNoticeBoard() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotices();
    }, []);

    const loadNotices = async () => {
        try {
            const data = await eventsApi.getPublic(undefined, true, 6);
            const result: any = data;
            const list = Array.isArray(result)
                ? result
                : Array.isArray(result?.events)
                    ? result.events
                    : [];
            setNotices(list);
        } catch (err) {
            console.error('Failed to load notices', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <section className="section-warm py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center py-12">
                        <div className="loading-spinner" />
                    </div>
                </div>
            </section>
        );
    }

    if (notices.length === 0) return null;

    return (
        <section className="section-warm py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <Bell className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Notice Board</h2>
                            <p className="text-gray-600">Latest Updates & Announcements</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 text-amber-700 font-semibold hover:text-amber-800 transition-colors group">
                        View All Notices
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>

                {/* Notice Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notices.map((notice, index) => (
                        <motion.div
                            key={notice.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="card-notice group cursor-pointer"
                        >
                            {/* Featured Badge */}
                            {notice.is_featured && (
                                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1 shadow-lg">
                                    <AlertCircle className="w-3 h-3" />
                                    Important
                                </div>
                            )}

                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 text-amber-600 group-hover:scale-110 transition-transform">
                                    <Pin className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-amber-700 transition-colors">
                                        {notice.title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {formatDate(notice.event_date)}
                                    </div>
                                </div>
                            </div>

                            <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed">
                                {notice.description}
                            </p>

                            {/* Type Tag */}
                            <div className="flex items-center justify-between">
                                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                    {notice.type?.replace('_', ' ')}
                                </span>
                                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
