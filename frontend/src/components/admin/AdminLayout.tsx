'use client';

/**
 * Admin Panel Layout - Premium Design
 *
 * Elegant sidebar navigation with smooth transitions,
 * refined visual hierarchy, and responsive design.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
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
  Bell,
  FileSpreadsheet,
  ExternalLink,
} from 'lucide-react';
import YearSelector from './YearSelector';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: string;
}

export default function AdminLayout({ children, activeSection }: AdminLayoutProps) {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">
        <div className="loading-spinner w-12 h-12" />
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { id: 'achievements', label: 'Achievements', icon: Trophy, href: '/admin/achievements' },
    { id: 'events', label: 'Events & Activities', icon: Calendar, href: '/admin/events' },
    { id: 'attendance', label: 'Attendance', icon: ClipboardCheck, href: '/admin/attendance' },
    { id: 'homework', label: 'Homework', icon: BookOpenCheck, href: '/admin/homework' },
    { id: 'fees', label: 'Fee Management', icon: Wallet, href: '/admin/fees' },
    { id: 'transport', label: 'Transport', icon: Bus, href: '/admin/transport' },
    { id: 'teacher-subjects', label: 'Teacher Subjects', icon: BookOpenCheck, href: '/admin/teacher-subjects' },
    { id: 'admissions', label: 'Admission Enquiries', icon: FileText, href: '/admin/admissions' },
    { id: 'approvals', label: 'User Approvals', icon: UserCheck, href: '/admin/approvals' },
    { id: 'users', label: 'User Management', icon: Users, href: '/admin/users' },
    { id: 'teachers', label: 'Teachers', icon: GraduationCap, href: '/admin/teachers' },
    { id: 'classes', label: 'Classes', icon: BookOpenCheck, href: '/admin/classes' },
    { id: 'marks', label: 'Upload Marks', icon: FileSpreadsheet, href: '/admin/marks' },
    { id: 'academic-year', label: 'Academic Year', icon: Calendar, href: '/admin/academic-year' },
    { id: 'notifications', label: 'Notifications', icon: Bell, href: '/admin/notifications' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/admin/settings' },
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-nunito">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 z-50 flex flex-col ${sidebarOpen ? 'w-72' : 'w-20'
          }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 flex-shrink-0">
          <AnimatePresence>
            {sidebarOpen && (
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-bambi text-xl"
              >
                JJA Admin
              </motion.h1>
            )}
          </AnimatePresence>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar custom-scrollbar-dark">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? '' : 'group-hover:scale-110'} transition-transform`} />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex-1 flex items-center justify-between overflow-hidden"
                    >
                      <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                      {isActive && <ChevronRight className="w-4 h-4" />}
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-white/10 flex-shrink-0 bg-slate-900/50">
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-3 px-2"
              >
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-400">Administrator</p>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-20'}`}
      >
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {menuItems.find((item) => item.id === activeSection)?.label || 'Admin Panel'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <YearSelector />
            <button
              onClick={() => router.push('/campus')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Go to Campus
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
