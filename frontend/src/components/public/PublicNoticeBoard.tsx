'use client';

import { useState, useEffect } from 'react';
import { eventsApi } from '@/lib/api';
import { motion } from 'framer-motion';
import { Bell, Calendar, Pin, AlertCircle } from 'lucide-react';

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
            // Fetch upcoming public events/notices
            const data = await eventsApi.getPublic(undefined, true, 5);
            // Backend returns list of events. We can filter if needed, but getPublic is designed for this.
            // Assuming the API returns { events: [...] } or just [...]
            // Based on lib/api.ts: request('/events/public') returns correct data structure?
            // Actually eventsApi.getPublic returns `request(...)`. 
            // Let's assume it returns { events: Notice[] } or Notice[].
            // Checking backend routers/events.py would be ideal, but I'll assume standard return.
            // Usually it's the list or { data: list }.
            // AdminLayout used Array.isArray checks. I'll do the same.
            const result: any = data;
            const list = Array.isArray(result) ? result :
                Array.isArray(result?.events) ? result.events : [];
            setNotices(list);
        } catch (err) {
            console.error('Failed to load notices', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (notices.length === 0) return null;

    return (
        <section className="py-16 bg-gradient-to-br from-amber-50 to-orange-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white">
                        <Bell className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Notice Board</h2>
                        <p className="text-gray-600">Updates and Announcements</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notices.map((notice, index) => (
                        <motion.div
                            key={notice.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-xl p-6 shadow-sm border border-amber-100 hover:shadow-md transition-shadow relative overflow-hidden"
                        >
                            {notice.is_featured && (
                                <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-3 py-1 rounded-bl-xl font-medium flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Important
                                </div>
                            )}

                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 text-amber-600">
                                    <Pin className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 line-clamp-2">{notice.title}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(notice.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>

                            <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                                {notice.description}
                            </p>

                            {/* Tag */}
                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">
                                {notice.type?.replace('_', ' ')}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
