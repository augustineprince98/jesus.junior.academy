'use client';

/**
 * Admin Dashboard
 *
 * Overview of system statistics and quick actions
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Users,
  FileText,
  Trophy,
  Calendar,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  pendingAdmissions: number;
  totalAchievements: number;
  upcomingEvents: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingAdmissions: 0,
    totalAchievements: 0,
    upcomingEvents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'ADMIN') {
      router.push('/campus');
      return;
    }

    // Load dashboard stats
    loadStats();
  }, [isAuthenticated, user, router]);

  const loadStats = async () => {
    try {
      // TODO: Create aggregated stats endpoint
      // For now, using placeholder values
      setStats({
        totalUsers: 0,
        pendingAdmissions: 0,
        totalAchievements: 0,
        upcomingEvents: 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      href: '/admin/users',
    },
    {
      title: 'Pending Admissions',
      value: stats.pendingAdmissions,
      icon: FileText,
      color: 'bg-orange-500',
      href: '/admin/admissions',
    },
    {
      title: 'Achievements',
      value: stats.totalAchievements,
      icon: Trophy,
      color: 'bg-yellow-500',
      href: '/admin/achievements',
    },
    {
      title: 'Upcoming Events',
      value: stats.upcomingEvents,
      icon: Calendar,
      color: 'bg-green-500',
      href: '/admin/events',
    },
  ];

  return (
    <AdminLayout activeSection="dashboard">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 mb-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-primary-100">
          Manage your school's digital presence from this central dashboard.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.title}
              onClick={() => router.push(card.href)}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 text-left group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
              </div>
              <p className="text-gray-600 text-sm mb-1">{card.title}</p>
              <p className="text-3xl font-bold text-gray-800">{card.value}</p>
            </button>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary-600" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            <p className="text-gray-500 text-sm">No recent activity to display.</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/admin/achievements')}
              className="w-full px-4 py-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors text-left font-semibold"
            >
              + Add Achievement
            </button>
            <button
              onClick={() => router.push('/admin/events')}
              className="w-full px-4 py-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors text-left font-semibold"
            >
              + Create Event
            </button>
            <button
              onClick={() => router.push('/admin/users')}
              className="w-full px-4 py-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors text-left font-semibold"
            >
              + Add User
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
