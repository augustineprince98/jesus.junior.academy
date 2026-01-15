'use client';

/**
 * Campus Header - Top navigation bar
 *
 * Shows:
 * - User info
 * - Notifications bell
 * - Quick actions
 * - Logout
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useCampusStore, useUIStore } from '@/store/useStore';
import {
  Bell,
  User,
  LogOut,
  Home,
  ChevronDown,
  Settings,
} from 'lucide-react';

export default function CampusHeader() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const exitBuilding = useCampusStore((s) => s.exitBuilding);
  const currentBuilding = useCampusStore((s) => s.currentBuilding);
  const unreadCount = useUIStore((s) => s.unreadCount);

  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const handleHome = () => {
    if (currentBuilding) {
      exitBuilding();
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-700';
      case 'CLASS_TEACHER':
        return 'bg-purple-100 text-purple-700';
      case 'TEACHER':
        return 'bg-blue-100 text-blue-700';
      case 'PARENT':
        return 'bg-green-100 text-green-700';
      case 'STUDENT':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left side - Logo & Home */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleHome}
            className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white transition-colors"
          >
            <Home className="w-5 h-5 text-primary-600" />
            <span className="font-medium text-primary-700 hidden sm:inline">
              Campus
            </span>
          </button>

          {currentBuilding && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm text-white/80 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm"
            >
              {currentBuilding.replace(/([A-Z])/g, ' $1').trim()}
            </motion.span>
          )}
        </div>

        {/* Right side - User & Notifications */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-2.5 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white transition-colors"
            >
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900 max-w-[120px] truncate">
                  {user?.name}
                </p>
                <span className={`text-xs px-1.5 py-0.5 rounded ${getRoleBadgeColor(user?.role || '')}`}>
                  {user?.role}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
                >
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-medium text-gray-900">{user?.name}</p>
                    <p className="text-sm text-gray-500">{user?.phone}</p>
                  </div>

                  {/* Menu items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // Handle profile
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>My Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // Handle settings
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="py-2 border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Exit Campus</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
