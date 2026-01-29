'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import { attendanceApi } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface AttendanceRecord {
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
  remarks?: string;
}

interface AttendanceStats {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  leave_days: number;
  percentage: number;
}

export default function AttendancePage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuthStore();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadAttendance();
  }, [isAuthenticated, router, token, currentMonth, currentYear]);

  const loadAttendance = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const data = await attendanceApi.getMyAttendance(token, currentMonth, currentYear);
      setAttendance((data as any).records || []);
      setStats((data as any).stats || null);
    } catch (err: any) {
      setError(err.detail || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]';
      case 'ABSENT':
        return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]';
      case 'LATE':
        return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]';
      case 'LEAVE':
        return 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]';
      default:
        return 'bg-white/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'ABSENT':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'LATE':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return null;
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const getAttendanceForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendance.find(a => a.date === dateStr);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 border border-transparent"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const record = getAttendanceForDate(day);
      const isToday = day === new Date().getDate() &&
        currentMonth === new Date().getMonth() + 1 &&
        currentYear === new Date().getFullYear();
      const isFuture = new Date(currentYear, currentMonth - 1, day) > new Date();

      days.push(
        <div
          key={day}
          className={`h-14 md:h-20 flex flex-col items-center justify-center relative p-1 rounded-xl border transition-all ${isToday
              ? 'border-blue-500/50 bg-blue-500/10'
              : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
            }`}
        >
          <span className={`text-sm ${isToday ? 'text-blue-400 font-bold' : 'text-white/60'}`}>
            {day}
          </span>

          <div className="mt-2">
            {record && !isFuture ? (
              <div className={`w-2 h-2 rounded-full ${getStatusColor(record.status)}`}></div>
            ) : isFuture ? (
              <span className="text-[10px] text-white/10">-</span>
            ) : (
              <div className="w-2 h-2 rounded-full bg-white/5"></div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  if (!isAuthenticated || !user) return null;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/campus')}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              Attendance History
              <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                Student
              </span>
            </h1>
            <p className="text-white/40 text-sm">Track your daily presence and consistency</p>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-2 border-t-transparent border-r-purple-500 border-b-transparent border-l-transparent animate-spin-slow"></div>
          </div>
        </div>
      ) : error ? (
        <div className="glass-card bg-red-500/10 border-red-500/20 p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-6">{error}</p>
          <button
            onClick={loadAttendance}
            className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors border border-red-500/20"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="col-span-2 md:col-span-1 glass-card p-5 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-500/5 to-transparent"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-white">{stats?.percentage.toFixed(1) || 0}%</p>
                  <p className="text-xs text-white/50 uppercase tracking-wider mt-1">Total Attendance</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className={`w-5 h-5 ${(stats?.percentage || 0) >= 75 ? 'text-green-400' : 'text-red-400'}`} />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-4 text-center hover:bg-white/5 transition-colors"
            >
              <p className="text-2xl font-bold text-green-400">{stats?.present_days || 0}</p>
              <p className="text-xs text-white/40 mt-1">Present</p>
            </motion.div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-4 text-center hover:bg-white/5 transition-colors"
            >
              <p className="text-2xl font-bold text-red-400">{stats?.absent_days || 0}</p>
              <p className="text-xs text-white/40 mt-1">Absent</p>
            </motion.div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-4 text-center hover:bg-white/5 transition-colors"
            >
              <p className="text-2xl font-bold text-yellow-400">{stats?.late_days || 0}</p>
              <p className="text-xs text-white/40 mt-1">Late</p>
            </motion.div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-4 text-center hover:bg-white/5 transition-colors"
            >
              <p className="text-2xl font-bold text-blue-400">{stats?.leave_days || 0}</p>
              <p className="text-xs text-white/40 mt-1">Leave</p>
            </motion.div>
          </div>

          {/* Low Attendance Warning */}
          {stats && stats.percentage < 75 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card bg-red-500/5 border-red-500/20 p-4 mb-8 flex items-start gap-4"
            >
              <div className="p-2 bg-red-500/10 rounded-full flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-bold text-white">Low Attendance Warning</p>
                <p className="text-sm text-red-300 mt-1">
                  Your attendance is currently below 75%. Please ensure you attend classes regularly to meet academic requirements.
                </p>
              </div>
            </motion.div>
          )}

          {/* Calendar Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-6 md:p-8"
          >
            {/* Calendar Controls */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-3 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="text-center">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {monthNames[currentMonth - 1]} {currentYear}
                </h2>
                <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Monthly Report</p>
              </div>

              <button
                onClick={() => navigateMonth('next')}
                className="p-3 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Week Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-bold text-white/30 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 md:gap-4">
              {renderCalendar()}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-8 border-t border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                <span className="text-sm text-white/60">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
                <span className="text-sm text-white/60">Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]"></div>
                <span className="text-sm text-white/60">Late</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></div>
                <span className="text-sm text-white/60">Leave</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </main>
  );
}
