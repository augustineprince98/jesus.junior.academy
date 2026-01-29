'use client';

/**
 * Public Notice Board - Igloo-Inspired Design
 *
 * Dark elegant notice cards with glass styling,
 * smooth animations, and accent colors.
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
            <section className="section-elevated py-16">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-center py-12">
                        <div className="loading-spinner" />
                    </div>
                </div>
            </section>
        );
    }

    // If no notices, show empty state instead of null to maintain layout
    if (!loading && notices.length === 0) {
        return (
            <section className="section-elevated py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid opacity-30" />
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center text-white/40">
                    <div className="icon-circle icon-circle-lg icon-circle-gold mx-auto mb-4 opacity-50">
                        <Bell className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Notice Board</h2>
                    <p>No new announcements at this time.</p>
                </div>
            </section>
        );
    }

    return (
        <section className="section-elevated py-20 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-grid opacity-30" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12"
                >
                    <div className="flex items-center gap-4">
                        <div className="icon-circle icon-circle-lg icon-circle-gold">
                            <Bell className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white">Notice Board</h2>
                            <p className="text-white/50">Latest Updates & Announcements</p>
                        </div>
                    </div>
                    <button className="btn btn-secondary text-sm flex items-center gap-2 group">
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
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className="glass-card p-6 group cursor-pointer relative"
                        >
                            {/* Featured Badge */}
                            {notice.is_featured && (
                                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1 shadow-lg">
                                    <AlertCircle className="w-3 h-3" />
                                    Important
                                </div>
                            )}

                            <div className="flex items-start gap-4 mb-4">
                                <div className="icon-circle icon-circle-md icon-circle-gold flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <Pin className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white line-clamp-2 group-hover:text-[#F5D76E] transition-colors">
                                        {notice.title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-white/40 mt-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {formatDate(notice.event_date)}
                                    </div>
                                </div>
                            </div>

                            <p className="text-white/50 text-sm line-clamp-3 mb-4 leading-relaxed">
                                {notice.description}
                            </p>

                            {/* Type Tag */}
                            <div className="flex items-center justify-between">
                                <span className="badge text-xs">
                                    {notice.type?.replace('_', ' ')}
                                </span>
                                <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-[#F5D76E] group-hover:translate-x-1 transition-all" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
