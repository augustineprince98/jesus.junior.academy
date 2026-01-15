'use client';

/**
 * Modern Campus Dashboard - Redesigned
 *
 * Clean, functional, card-based interface
 * Role-based content display
 * Inspired by modern dashboard designs
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  BookOpen,
  DollarSign,
  Bell,
  Users,
  Calendar,
  BarChart3,
  FileText,
  Clock,
  Trophy,
  Home,
  LogOut,
  ChevronRight,
  Star,
  TrendingUp,
  Activity,
  User,
  Settings,
  Shield,
} from 'lucide-react';

interface DashboardCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  href: string;
  roles: string[];
  badge?: string;
}

export default function ModernCampusPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
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
      roles: ['STUDENT', 'TEACHER', 'CLASS_TEACHER'],
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
      title: 'My Classes',
      description: 'Manage your classes and students',
      icon: Users,
      color: 'from-indigo-500 to-purple-600',
      href: '/campus/classes',
      roles: ['TEACHER', 'CLASS_TEACHER'],
    },
    {
      id: 'mark-attendance',
      title: 'Mark Attendance',
      description: 'Take roll call and mark student attendance',
      icon: Clock,
      color: 'from-pink-500 to-rose-600',
      href: '/campus/attendance',
      roles: ['TEACHER', 'CLASS_TEACHER'],
    },
    {
      id: 'upload-marks',
      title: 'Upload Marks',
      description: 'Enter exam marks and update results',
      icon: FileText,
      color: 'from-teal-500 to-cyan-600',
      href: '/campus/results',
      roles: ['TEACHER', 'CLASS_TEACHER'],
    },

    // COMMON Cards
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'View important announcements and updates',
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

  const userCards = cards.filter((card) => user?.role && card.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const getRoleName = (role: string) => {
    return role.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Modern Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-lg bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Jesus Junior Academy</h1>
                <p className="text-xs text-gray-500">Digital Campus</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go to Homepage"
              >
                <Home className="w-5 h-5 text-gray-600" />
              </button>

              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{getRoleName(user.role)}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {greeting}, {user.name.split(' ')[0]}!
          </h2>
          <p className="text-gray-600">
            Welcome to your digital campus. Select a service below to get started.
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
                transition={{ delay: index * 0.05 }}
              >
                <button
                  onClick={() => router.push(card.href)}
                  className="w-full group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-transparent overflow-hidden text-left"
                >
                  {/* Gradient Background (on hover) */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                  {/* Content */}
                  <div className="relative">
                    {/* Icon & Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      {card.badge && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                          {card.badge}
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">{card.description}</p>

                    {/* Arrow */}
                    <div className="flex items-center text-sm font-semibold text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Open</span>
                      <ChevronRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Stats (Optional) */}
        {user.role === 'STUDENT' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Attendance</p>
                  <p className="text-2xl font-bold text-gray-900">92%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Homework</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Overall Grade</p>
                  <p className="text-2xl font-bold text-gray-900">A</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" fill="currentColor" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
