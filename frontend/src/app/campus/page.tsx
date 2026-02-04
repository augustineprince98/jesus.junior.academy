'use client';

/**
 * Modern Campus Dashboard - Igloo.inc Inspired
 *
 * Dark, glassmorphic interface with particle effects
 * and verified role-based access.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import { motion } from 'framer-motion';
import {
  BookOpen,
  DollarSign,
  Bell,
  Users,
  Calendar,
  BarChart3,
  FileText,
  Clock,
  Trophy,
  ChevronRight,
  TrendingUp,
  Star,
  Shield,
  Sparkles,
} from 'lucide-react';

interface DashboardCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string; // Tailwind gradient classes
  href: string;
  roles: string[];
  badge?: string;
}

export default function ModernCampusPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, [isAuthenticated, router]);

  const cards: DashboardCard[] = [
    // ADMIN Cards
    {
      id: 'admin-panel',
      title: 'Admin Panel',
      description: 'Manage content, users, and system settings',
      icon: Shield,
      color: 'from-red-500 to-pink-600',
      href: '/admin',
      roles: ['ADMIN'],
    },

    // STUDENT Cards
    {
      id: 'my-results',
      title: 'My Results',
      description: 'View your exam marks, grades, and performance',
      icon: BarChart3,
      color: 'from-blue-500 to-indigo-600',
      href: '/campus/results',
      roles: ['STUDENT'],
      badge: 'New',
    },
    {
      id: 'homework',
      title: 'Homework',
      description: 'Check assignments and submission deadlines',
      icon: BookOpen,
      color: 'from-green-500 to-emerald-600',
      href: '/campus/homework',
      roles: ['STUDENT', 'PARENT'],
    },
    {
      id: 'attendance',
      title: 'Attendance',
      description: 'View your attendance record and history',
      icon: Calendar,
      color: 'from-purple-500 to-violet-600',
      href: '/campus/attendance',
      roles: ['STUDENT', 'TEACHER', 'CLASS_TEACHER', 'ADMIN'],
    },

    // PARENT Cards
    {
      id: 'fees',
      title: 'Fees & Payments',
      description: 'View fee details and payment history',
      icon: DollarSign,
      color: 'from-yellow-500 to-orange-600',
      href: '/campus/fees',
      roles: ['PARENT'],
    },
    {
      id: 'child-progress',
      title: 'Child Progress',
      description: "Track your child's academic performance",
      icon: TrendingUp,
      color: 'from-cyan-500 to-blue-600',
      href: '/campus/results',
      roles: ['PARENT'],
    },

    // TEACHER Cards
    {
      id: 'my-classes',
      title: 'Manage Classes',
      description: 'Manage classes and students',
      icon: Users,
      color: 'from-indigo-500 to-purple-600',
      href: '/campus/classes',
      roles: ['TEACHER', 'CLASS_TEACHER'],
    },
    {
      id: 'admin-classes',
      title: 'Class Management',
      description: 'Manage classes, subjects, and exams',
      icon: Users,
      color: 'from-indigo-500 to-purple-600',
      href: '/admin/classes',
      roles: ['ADMIN'],
    },
    {
      id: 'assign-homework',
      title: 'Assign Homework',
      description: 'Create and publish homework assignments',
      icon: BookOpen,
      color: 'from-green-500 to-emerald-600',
      href: '/campus/homework',
      roles: ['TEACHER', 'CLASS_TEACHER', 'ADMIN'],
    },
    {
      id: 'mark-attendance',
      title: 'Mark Attendance',
      description: 'Take roll call and mark student attendance',
      icon: Clock,
      color: 'from-pink-500 to-rose-600',
      href: '/campus/attendance/mark',
      roles: ['TEACHER', 'CLASS_TEACHER', 'ADMIN'],
    },
    {
      id: 'upload-marks',
      title: 'Upload Marks',
      description: 'Enter exam marks and update results',
      icon: FileText,
      color: 'from-teal-500 to-cyan-600',
      href: '/campus/results',
      roles: ['TEACHER', 'CLASS_TEACHER', 'ADMIN'],
    },
    {
      id: 'class-notice',
      title: 'Send Notice',
      description: 'Send announcements to class parents',
      icon: Bell,
      color: 'from-orange-500 to-red-600',
      href: '/admin/notifications',
      roles: ['CLASS_TEACHER', 'ADMIN'],
    },
    {
      id: 'leave-request',
      title: 'Leave Request',
      description: 'Apply for leave and view status',
      icon: Calendar,
      color: 'from-gray-500 to-slate-600',
      href: '/campus/leave',
      roles: ['TEACHER', 'CLASS_TEACHER'],
    },

    // STUDENT Cards - Fees
    {
      id: 'student-fees',
      title: 'My Fees',
      description: 'View fee details and payment status',
      icon: DollarSign,
      color: 'from-emerald-500 to-green-600',
      href: '/campus/fees',
      roles: ['STUDENT'],
    },

    // COMMON Cards
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Check announcements and updates',
      icon: Bell,
      color: 'from-amber-500 to-yellow-600',
      href: '/campus/notifications',
      roles: ['STUDENT', 'PARENT', 'TEACHER', 'CLASS_TEACHER', 'ADMIN'],
      badge: '3',
    },
    {
      id: 'events',
      title: 'Events & Activities',
      description: 'Upcoming school events and celebrations',
      icon: Calendar,
      color: 'from-violet-500 to-purple-600',
      href: '/campus/events',
      roles: ['STUDENT', 'PARENT', 'TEACHER', 'CLASS_TEACHER', 'ADMIN'],
    },
    {
      id: 'achievements',
      title: 'Achievements',
      description: 'View student achievements and awards',
      icon: Trophy,
      color: 'from-yellow-500 to-amber-600',
      href: '/campus/achievements',
      roles: ['STUDENT', 'PARENT', 'TEACHER', 'CLASS_TEACHER', 'ADMIN'],
    },
  ];

  if (!isAuthenticated || !user) {
    return null;
  }

  // Filter cards based on user role
  const userCards = Array.isArray(cards) && user?.role
    ? cards.filter((card) => card.roles.includes(user.role))
    : [];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mb-12 relative"
      >
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-[var(--accent-blue)]/20 rounded-full blur-[100px] pointer-events-none" />

        <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4 tracking-tight">
          {greeting}, <span className="text-gradient-accent">{user.name.split(' ')[0]}</span>
        </h2>
        <p className="text-[var(--text-secondary)] text-lg max-w-2xl">
          Welcome to your digital campus. Access your tools, track progress, and stay updated with the latest announcements.
        </p>
      </motion.div>

      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
            >
              <button
                onClick={() => router.push(card.href)}
                className="w-full group relative glass-card p-8 h-full text-left overflow-hidden hover:bg-[var(--glass-hover)] transition-all duration-500"
              >
                {/* Gradient Glow Effect on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-x-2 group-hover:translate-x-0">
                  <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} p-[1px] group-hover:scale-110 transition-transform duration-500`}>
                      <div className="w-full h-full rounded-2xl bg-[var(--bg-card)] flex items-center justify-center">
                        <Icon className="w-7 h-7 text-[var(--text-primary)]" />
                      </div>
                    </div>
                    {card.badge && (
                      <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg shadow-red-500/20">
                        {card.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent-blue)] transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4 group-hover:text-[var(--text-primary)]/70 transition-colors">
                    {card.description}
                  </p>

                  {/* Hover Line */}
                  <div className="h-0.5 w-0 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-700 ease-out" />
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Stats (Student Only) */}
      {user.role === 'STUDENT' && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <div className="flex items-center gap-2 mb-6 text-[var(--text-secondary)] text-sm uppercase tracking-widest font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Quick Insights</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 flex items-center justify-between border-l-4 border-l-green-500">
              <div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">Attendance</p>
                <p className="text-3xl font-bold text-[var(--text-primary)]">92%</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
            </div>

            <div className="glass-card p-6 flex items-center justify-between border-l-4 border-l-blue-500">
              <div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">Assigned Homework</p>
                <p className="text-3xl font-bold text-[var(--text-primary)]">3</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-500" />
              </div>
            </div>

            <div className="glass-card p-6 flex items-center justify-between border-l-4 border-l-yellow-500">
              <div>
                <p className="text-sm text-[var(--text-secondary)] mb-1">Performance</p>
                <p className="text-3xl font-bold text-[var(--text-primary)]">A</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </main>
  );
}
