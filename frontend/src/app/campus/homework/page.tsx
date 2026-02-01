'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import { homeworkApi, teacherSubjectsApi, schoolApi } from '@/lib/api';
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
  X,
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

interface TeacherAssignment {
  class_id: number;
  class_name: string;
  subjects: { subject_id: number; subject_name: string }[];
}

interface HomeworkFormData {
  class_id: number;
  subject_id: number;
  title: string;
  description: string;
  assigned_date: string;
  due_date: string;
}

export default function HomeworkPage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuthStore();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'overdue'>('all');

  // Teacher homework form states
  const [showModal, setShowModal] = useState(false);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [currentAcademicYearId, setCurrentAcademicYearId] = useState<number | null>(null);
  const [formData, setFormData] = useState<HomeworkFormData>({
    class_id: 0,
    subject_id: 0,
    title: '',
    description: '',
    assigned_date: new Date().toISOString().split('T')[0],
    due_date: '',
  });

  // Get available subjects based on selected class
  const availableSubjects = teacherAssignments.find(a => a.class_id === formData.class_id)?.subjects || [];

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadHomework();
    loadCurrentAcademicYear();
  }, [isAuthenticated, router, token]);

  const loadCurrentAcademicYear = async () => {
    if (!token) return;

    try {
      const data = await schoolApi.getAcademicYears(token);
      const currentYear = data.find((year: any) => year.is_current);
      if (currentYear) {
        setCurrentAcademicYearId(currentYear.id);
      }
    } catch (err: any) {
      console.error('Failed to load academic year:', err);
    }
  };

  const loadHomework = async () => {
    if (!token) return;

    // For students, load homework
    if (user?.student_id) {
      try {
        setLoading(true);
        setError(null);

        const data = await homeworkApi.getForStudent(token, user.student_id, false);
        // Ensure homework is always an array
        setHomework(Array.isArray((data as any)?.homework) ? (data as any).homework : []);
      } catch (err: any) {
        const errorMessage = typeof err.detail === 'string' ? err.detail :
          err.message ||
          'Failed to load homework';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    } else if (user?.role === 'TEACHER' || user?.role === 'CLASS_TEACHER' || user?.role === 'ADMIN') {
      // For teachers and admin, just hide loading state
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  // Load teacher's assigned classes and subjects when modal opens
  const loadTeacherAssignments = async () => {
    if (!token) return;

    try {
      setLoadingAssignments(true);
      const data = await teacherSubjectsApi.getMyAssignments(token);
      setTeacherAssignments((data as any).classes || []);
    } catch (err: any) {
      setFormError('Failed to load your class assignments');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const openModal = () => {
    setShowModal(true);
    setFormError(null);
    setFormSuccess(null);
    setFormData({
      class_id: 0,
      subject_id: 0,
      title: '',
      description: '',
      assigned_date: new Date().toISOString().split('T')[0],
      due_date: '',
    });
    loadTeacherAssignments();
  };

  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Validation
    if (!formData.class_id || !formData.subject_id) {
      setFormError('Please select a class and subject');
      return;
    }
    if (!formData.title.trim()) {
      setFormError('Please enter a title');
      return;
    }
    if (!formData.due_date) {
      setFormError('Please select a due date');
      return;
    }

    if (!currentAcademicYearId) {
      setFormError('Academic year not loaded. Please refresh the page.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      await homeworkApi.create(token, {
        class_id: formData.class_id,
        subject_id: formData.subject_id,
        academic_year_id: currentAcademicYearId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        assigned_date: formData.assigned_date,
        due_date: formData.due_date,
      });

      setFormSuccess('Homework assigned successfully!');
      setTimeout(() => {
        setShowModal(false);
        setFormSuccess(null);
      }, 1500);
    } catch (err: any) {
      setFormError(err.detail || 'Failed to create homework');
    } finally {
      setSubmitting(false);
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

  // Ensure homework is always an array before filtering
  const homeworkArray = Array.isArray(homework) ? homework : [];
  const filteredHomework = homeworkArray.filter(hw => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !hw.is_completed && !isOverdue(hw.due_date);
    if (filter === 'submitted') return hw.is_completed;
    if (filter === 'overdue') return !hw.is_completed && isOverdue(hw.due_date);
    return true;
  });

  const stats = {
    total: homeworkArray.length,
    pending: homeworkArray.filter(h => !h.is_completed && !isOverdue(h.due_date)).length,
    submitted: homeworkArray.filter(h => h.is_completed).length,
    overdue: homeworkArray.filter(h => !h.is_completed && isOverdue(h.due_date)).length,
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

            {(user.role === 'TEACHER' || user.role === 'CLASS_TEACHER' || user.role === 'ADMIN') && (
              <button
                onClick={openModal}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
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
                className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${filter === 'all' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-100'
                  }`}
              >
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </button>

              <button
                onClick={() => setFilter('pending')}
                className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${filter === 'pending' ? 'border-yellow-500 ring-2 ring-yellow-200' : 'border-gray-100'
                  }`}
              >
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </button>

              <button
                onClick={() => setFilter('submitted')}
                className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${filter === 'submitted' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-100'
                  }`}
              >
                <p className="text-2xl font-bold text-green-600">{stats.submitted}</p>
                <p className="text-sm text-gray-600">Submitted</p>
              </button>

              <button
                onClick={() => setFilter('overdue')}
                className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${filter === 'overdue' ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-100'
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

      {/* Homework Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Assign Homework</h2>
                  <p className="text-xs text-gray-500">Create a new assignment</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitHomework} className="p-6 space-y-5">
              {/* Error/Success Messages */}
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                  {formSuccess}
                </div>
              )}

              {loadingAssignments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : teacherAssignments.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">No class assignments found</p>
                  <p className="text-sm text-gray-500">
                    Please contact admin to assign you to classes and subjects.
                  </p>
                </div>
              ) : (
                <>
                  {/* Class Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.class_id}
                      onChange={(e) => setFormData({
                        ...formData,
                        class_id: Number(e.target.value),
                        subject_id: 0, // Reset subject when class changes
                      })}
                      })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                    >
                    <option value={0}>Select a class</option>
                    {teacherAssignments.map(assignment => (
                      <option key={assignment.class_id} value={assignment.class_id}>
                        {assignment.class_name}
                      </option>
                    ))}
                  </select>
                </div>

              {/* Subject Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: Number(e.target.value) })}
                  disabled={!formData.class_id}
                  disabled={!formData.class_id}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 bg-white text-gray-900"
                >
                  <option value={0}>
                    {formData.class_id ? 'Select a subject' : 'Select class first'}
                  </option>
                  {availableSubjects.map(subject => (
                    <option key={subject.subject_id} value={subject.subject_id}>
                      {subject.subject_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Chapter 5 Exercise Questions"
                  placeholder="e.g., Chapter 5 Exercise Questions"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add details about the homework..."
                  rows={3}
                  placeholder="Add details about the homework..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none bg-white text-gray-900"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned Date
                  </label>
                  <input
                    type="date"
                    value={formData.assigned_date}
                    onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    min={formData.assigned_date}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Assign Homework
                    </>
                  )}
                </button>
              </div>
            </>
              )}
          </form>
        </motion.div>
        </div>
  )
}
    </div >
  );
}
