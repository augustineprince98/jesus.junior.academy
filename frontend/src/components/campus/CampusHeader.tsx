'use client';

import { useAuthStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { GraduationCap, Home, LogOut, Bell, User } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function CampusHeader() {
    const router = useRouter();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const getRoleName = (role: string) => {
        return role?.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()) || 'User';
    };

    if (!user) return null;

    return (
        <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-[var(--glass-border)] bg-[var(--bg-primary)]/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/campus" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-blue)]/20 to-[var(--accent-purple)]/20 border border-[var(--glass-border)] flex items-center justify-center group-hover:scale-105 transition-transform">
                            <GraduationCap className="w-6 h-6 text-[var(--accent-blue)]" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Jesus Junior Academy</h1>
                            <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] group-hover:text-[var(--accent-blue)] transition-colors">Digital Campus</p>
                        </div>
                    </Link>

                    {/* Right Actions */}
                    <div className="flex items-center gap-6">
                        {/* Navigation Icons */}
                        <div className="flex items-center gap-2 pr-6 border-r border-[var(--glass-border)]">
                            <Link href="/">
                                <button className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover)] rounded-full transition-all" title="Return to Homepage">
                                    <Home className="w-5 h-5" />
                                </button>
                            </Link>
                            <Link href="/campus/notifications">
                                <button className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-hover)] rounded-full transition-all relative" title="Notifications">
                                    <Bell className="w-5 h-5" />
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[var(--bg-primary)]"></span>
                                </button>
                            </Link>
                        </div>

                        {/* Profile & Logout */}
                        <div className="flex items-center gap-4">
                            <div className="hidden md:block text-right">
                                <p className="text-sm font-medium text-[var(--text-primary)]">{user.name}</p>
                                <div className="flex items-center justify-end gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    <p className="text-xs text-[var(--text-secondary)]">{getRoleName(user.role)}</p>
                                </div>
                            </div>

                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] p-[1px]">
                                <div className="w-full h-full rounded-full bg-[var(--bg-card)] flex items-center justify-center overflow-hidden">
                                    {user.name ? (
                                        <span className="text-[var(--text-primary)] font-bold">{user.name.charAt(0)}</span>
                                    ) : (
                                        <User className="w-5 h-5 text-[var(--text-secondary)]" />
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="p-2 text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all ml-2"
                                title="Sign Out"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
