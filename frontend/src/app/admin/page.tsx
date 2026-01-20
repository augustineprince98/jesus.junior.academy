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
import { usersApi } from '@/lib/api';
import {
  Users,
  FileText,
  Trophy,
  Calendar,
  TrendingUp,
  AlertCircle,
  Bell,
  GraduationCap,
  UserCog,
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  pendingAdmissions: number;
  totalAchievements: number;
  upcomingEvents: number;
  byRole?: {
    students: number;
    parents: number;
    teachers: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuthStore();
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
  }, [isAuthenticated, user, router, token]);

  const loadStats = async () => {
    try {
      if (!token) return;

      const result = await usersApi.getDashboardStats(token);
      setStats(result);
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Keep default values on error
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
              onClick={() => router.push('/admin/notifications')}
              className="w-full px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-left font-semibold flex items-center gap-2"
            >
              <Bell className="w-5 h-5" />
              Send Notice/Announcement
            </button>
            <button
              onClick={() => router.push('/admin/approvals')}
              className="w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-left font-semibold flex items-center gap-2"
            >
              <UserCog className="w-5 h-5" />
              Approve Pending Users ({stats.pendingAdmissions})
            </button>
            <button
              onClick={() => router.push('/admin/achievements')}
              className="w-full px-4 py-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors text-left font-semibold flex items-center gap-2"
            >
              <Trophy className="w-5 h-5" />
              Add Achievement
            </button>
            <button
              onClick={() => router.push('/admin/events')}
              className="w-full px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-left font-semibold flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Create Event
            </button>
            <button
              onClick={() => router.push('/admin/users')}
              className="w-full px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-left font-semibold flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              Manage Users
            </button>
          </div>
        </div>
      </div>

      {/* User Breakdown */}
      {stats.byRole && (
        <div className="mt-6 bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">User Breakdown</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-700">{stats.byRole.students}</p>
                  <p className="text-sm text-blue-600">Students</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-700">{stats.byRole.parents}</p>
                  <p className="text-sm text-green-600">Parents</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <UserCog className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-purple-700">{stats.byRole.teachers}</p>
                  <p className="text-sm text-purple-600">Teachers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
