'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import { homeworkApi } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Plus,
  FileText,
} from 'lucide-react';

interface Homework {
  id: number;
  title: string;
  description: string;
  subject_name: string;
  subject_id: number;
  due_date: string;
  assigned_date: string;
  teacher_name: string;
  status: 'pending' | 'submitted' | 'overdue';
  is_completed: boolean;
}

export default function HomeworkPage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuthStore();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'overdue'>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadHomework();
  }, [isAuthenticated, router, token]);

  const loadHomework = async () => {
    if (!token || !user?.student_id) return;

    try {
      setLoading(true);
      setError(null);

      const data = await homeworkApi.getForStudent(token, user.student_id, false);
      setHomework((data as any).homework || []);
    } catch (err: any) {
      setError(err.detail || 'Failed to load homework');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'text-green-600 bg-green-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (dueDate: string) => {
    const diff = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)} days overdue`;
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return `${diff} days left`;
  };

  const filteredHomework = homework.filter(hw => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !hw.is_completed && !isOverdue(hw.due_date);
    if (filter === 'submitted') return hw.is_completed;
    if (filter === 'overdue') return !hw.is_completed && isOverdue(hw.due_date);
    return true;
  });

  const stats = {
    total: homework.length,
    pending: homework.filter(h => !h.is_completed && !isOverdue(h.due_date)).length,
    submitted: homework.filter(h => h.is_completed).length,
    overdue: homework.filter(h => !h.is_completed && isOverdue(h.due_date)).length,
  };

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/campus')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Homework</h1>
                <p className="text-xs text-gray-500">Assignments & Deadlines</p>
              </div>
            </div>

            {(user.role === 'TEACHER' || user.role === 'CLASS_TEACHER') && (
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Plus className="w-4 h-4" />
                Assign Homework
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadHomework}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              <button
                onClick={() => setFilter('all')}
                className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${
                  filter === 'all' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-100'
                }`}
              >
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </button>

              <button
                onClick={() => setFilter('pending')}
                className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${
                  filter === 'pending' ? 'border-yellow-500 ring-2 ring-yellow-200' : 'border-gray-100'
                }`}
              >
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </button>

              <button
                onClick={() => setFilter('submitted')}
                className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${
                  filter === 'submitted' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-100'
                }`}
              >
                <p className="text-2xl font-bold text-green-600">{stats.submitted}</p>
                <p className="text-sm text-gray-600">Submitted</p>
              </button>

              <button
                onClick={() => setFilter('overdue')}
                className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${
                  filter === 'overdue' ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-100'
                }`}
              >
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                <p className="text-sm text-gray-600">Overdue</p>
              </button>
            </motion.div>

            {/* Homework List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              {filteredHomework.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No homework found</p>
                </div>
              ) : (
                filteredHomework.map((hw, index) => {
                  const status = hw.is_completed ? 'submitted' : isOverdue(hw.due_date) ? 'overdue' : 'pending';
                  return (
                    <motion.div
                      key={hw.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                              {hw.subject_name}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(status)}`}>
                              {getStatusIcon(status)}
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </div>

                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{hw.title}</h3>
                          <p className="text-gray-600 text-sm mb-4">{hw.description}</p>

                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>Due: {formatDate(hw.due_date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span className={status === 'overdue' ? 'text-red-600 font-medium' : ''}>
                                {getDaysRemaining(hw.due_date)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              <span>By: {hw.teacher_name}</span>
                            </div>
                          </div>
                        </div>

                        {!hw.is_completed && (
                          <button className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                            Submit
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
