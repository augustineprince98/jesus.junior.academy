'use client';

/**
 * Admin Panel Layout
 *
 * Sidebar navigation with sections for content management,
 * user management, admissions, and settings
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import {
  LayoutDashboard,
  Trophy,
  Calendar,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  UserCheck,
  Wallet,
  Bus,
  BookOpenCheck,
  GraduationCap,
  ClipboardCheck,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: string;
}

export default function AdminLayout({ children, activeSection }: AdminLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check if user is admin
  if (user?.role !== 'ADMIN') {
    router.push('/campus');
    return null;
  }

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/admin',
    },
    {
      id: 'achievements',
      label: 'Achievements',
      icon: Trophy,
      href: '/admin/achievements',
    },
    {
      id: 'events',
      label: 'Events & Activities',
      icon: Calendar,
      href: '/admin/events',
    },
    {
      id: 'fees',
      label: 'Fee Management',
      icon: Wallet,
      href: '/admin/fees',
    },
    {
      id: 'transport',
      label: 'Transport',
      icon: Bus,
      href: '/admin/transport',
    },
    {
      id: 'teacher-subjects',
      label: 'Teacher Subjects',
      icon: BookOpenCheck,
      href: '/admin/teacher-subjects',
    },
    {
      id: 'admissions',
      label: 'Admission Enquiries',
      icon: FileText,
      href: '/admin/admissions',
    },
    {
      id: 'approvals',
      label: 'User Approvals',
      icon: UserCheck,
      href: '/admin/approvals',
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      href: '/admin/users',
    },
    {
      id: 'teachers',
      label: 'Teachers',
      icon: GraduationCap,
      href: '/admin/teachers',
    },
    {
      id: 'classes',
      label: 'Classes',
      icon: BookOpenCheck,
      href: '/admin/classes',
    },
    {
      id: 'academic-year',
      label: 'Academic Year',
      icon: Calendar,
      href: '/admin/academic-year',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: '/admin/settings',
    },
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 font-nunito">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-primary-800 text-white transition-all duration-300 z-50 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-primary-700">
          {sidebarOpen && (
            <h1 className="font-bambi text-xl">JJA Admin</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-primary-100 hover:bg-primary-700'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-700">
          {sidebarOpen && (
            <div className="mb-3 px-2">
              <p className="text-sm font-semibold text-white">{user?.name}</p>
              <p className="text-xs text-primary-300">Administrator</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-primary-100 hover:bg-primary-700 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {menuItems.find((item) => item.id === activeSection)?.label || 'Admin Panel'}
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/campus')}
              className="px-4 py-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              Go to Campus
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
