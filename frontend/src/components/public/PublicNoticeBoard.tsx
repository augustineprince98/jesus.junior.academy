'use client';

/**
 * Public Notice Board - Igloo.inc Inspired
 *
 * Enhanced with scroll-driven reveal animations,
 * staggered card entrances, and chromatic effects.
 */

import { useState, useEffect, useRef } from 'react';
import { eventsApi } from '@/lib/api';
import { motion, useScroll, useTransform } from 'framer-motion';
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
    const sectionRef = useRef<HTMLElement>(null);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start end', 'end start'],
    });

    const headerY = useTransform(scrollYProgress, [0, 0.3], [60, 0]);
    const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);

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
            <section ref={sectionRef} className="section-elevated py-16">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-center py-12">
                        <div className="loading-spinner" />
                    </div>
                </div>
            </section>
        );
    }

    if (!loading && notices.length === 0) {
        return (
            <section ref={sectionRef} className="section-elevated py-20 relative overflow-hidden">
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
        <section ref={sectionRef} className="section-elevated py-20 relative overflow-hidden noise-overlay">
            {/* Background */}
            <div className="absolute inset-0 bg-grid opacity-30" />

            {/* Section glow line at top */}
            <div className="absolute top-0 left-0 right-0 section-divider-glow" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header with scroll parallax */}
                <motion.div
                    style={{ y: headerY, opacity: headerOpacity }}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12"
                >
                    <div className="flex items-center gap-4">
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            whileInView={{ scale: 1, rotate: 0 }}
                            viewport={{ once: true }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                            className="icon-circle icon-circle-lg icon-circle-gold"
                        >
                            <Bell className="w-6 h-6" />
                        </motion.div>
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white glitch-text">Notice Board</h2>
                            <p className="text-white/50">Latest Updates & Announcements</p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ x: 5 }}
                        className="btn btn-secondary text-sm flex items-center gap-2 group"
                    >
                        View All Notices
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                </motion.div>

                {/* Notice Cards Grid - staggered entrance */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notices.map((notice, index) => (
                        <motion.div
                            key={notice.id}
                            initial={{ opacity: 0, y: 60, scale: 0.9 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{
                                delay: index * 0.12,
                                duration: 0.7,
                                ease: [0.25, 0.46, 0.45, 0.94],
                            }}
                            whileHover={{ y: -8, transition: { duration: 0.3 } }}
                            className="glass-card p-6 group cursor-pointer relative"
                        >
                            {/* Featured Badge */}
                            {notice.is_featured && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: index * 0.12 + 0.3 }}
                                    className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1 shadow-lg"
                                >
                                    <AlertCircle className="w-3 h-3" />
                                    Important
                                </motion.div>
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
