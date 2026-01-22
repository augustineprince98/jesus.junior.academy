'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import { attendanceApi, teacherSubjectsApi, enrollmentApi } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Save,
  AlertCircle,
  UserCheck,
  UserX,
} from 'lucide-react';

interface Student {
  id: number;
  name: string;
  roll_number?: string;
  enrollment_id: number;
}

interface AttendanceRecord {
  student_id: number;
  status: string;
  remarks?: string;
}

interface ClassInfo {
  class_id: number;
  class_name: string;
  academic_year_id: number;
  academic_year_name: string;
}

export default function MarkAttendancePage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuthStore();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<number, boolean>>({});
  const [remarks, setRemarks] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'TEACHER' && user?.role !== 'CLASS_TEACHER' && user?.role !== 'ADMIN')) {
      router.push('/login');
      return;
    }

    loadTeacherClasses();
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (selectedClass && selectedDate) {
      loadStudents();
    }
  }, [selectedClass, selectedDate]);

  const loadTeacherClasses = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await teacherSubjectsApi.getMyAssignments(token);
      const classList: ClassInfo[] = data.classes.map((cls: any) => ({
        class_id: cls.class_id,
        class_name: cls.class_name,
        academic_year_id: 1, // TODO: Get from API
        academic_year_name: data.academic_year,
      }));
      setClasses(classList);

      // Auto-select first class if available
      if (classList.length > 0) {
        setSelectedClass(classList[0]);
      }
    } catch (err: any) {
      setError(err.detail || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    if (!token || !selectedClass) return;

    try {
      setError(null);
      const data = await enrollmentApi.getClassStudents(token, selectedClass.class_id, selectedClass.academic_year_id);

      const studentList: Student[] = data.students.map(s => ({
        id: s.id,
        name: s.name,
        roll_number: s.roll_number || undefined,
        enrollment_id: s.enrollment_id,
      }));

      setStudents(studentList);

      // Initialize attendance as all present
      const initialAttendance: Record<number, boolean> = {};
      studentList.forEach(student => {
        initialAttendance[student.id] = true;
      });
      setAttendance(initialAttendance);
    } catch (err: any) {
      setError(err.detail || 'Failed to load students');
      setStudents([]);
    }
  };

  const handleAttendanceChange = (studentId: number, isPresent: boolean) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: isPresent,
    }));
  };

  const handleRemarksChange = (studentId: number, remark: string) => {
    setRemarks(prev => ({
      ...prev,
      [studentId]: remark,
    }));
  };

  const handleSaveAttendance = async () => {
    if (!token || !selectedClass) return;

    try {
      setSaving(true);
      setError(null);

      const records: AttendanceRecord[] = students.map(student => ({
        student_id: student.id,
        status: attendance[student.id] ? 'PRESENT' : 'ABSENT',
        remarks: remarks[student.id] || '',
      }));

      await attendanceApi.markBulkAttendance(
        token,
        selectedClass.class_id,
        selectedClass.academic_year_id,
        selectedDate,
        records
      );

      setSuccess('Attendance marked successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.detail || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const getAttendanceStats = () => {
    const present = Object.values(attendance).filter(Boolean).length;
    const absent = students.length - present;
    return { present, absent, total: students.length };
  };

  if (!isAuthenticated || (user?.role !== 'TEACHER' && user?.role !== 'CLASS_TEACHER' && user?.role !== 'ADMIN')) return null;

  const stats = getAttendanceStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Mark Attendance</h1>
                <p className="text-xs text-gray-500">Record daily student attendance</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Class and Date Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Class
                  </label>
                  <select
                    value={selectedClass?.class_id || ''}
                    onChange={(e) => {
                      const classId = Number(e.target.value);
                      const cls = classes.find(c => c.class_id === classId);
                      setSelectedClass(cls || null);
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a class</option>
                    {classes.map(cls => (
                      <option key={cls.class_id} value={cls.class_id}>
                        {cls.class_name} ({cls.academic_year_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attendance Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </motion.div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-green-600">
                {success}
              </div>
            )}

            {selectedClass && (
              <>
                {/* Stats Cards */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
                >
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        <p className="text-sm text-gray-600">Total Students</p>
                      </div>
                      <Users className="w-8 h-8 text-gray-600" />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                        <p className="text-sm text-gray-600">Present</p>
                      </div>
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                        <p className="text-sm text-gray-600">Absent</p>
                      </div>
                      <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%
                        </p>
                        <p className="text-sm text-gray-600">Attendance Rate</p>
                      </div>
                      <Calendar className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                </motion.div>

                {/* Students List */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {selectedClass.class_name} - Attendance for {new Date(selectedDate).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </h2>
                        <p className="text-sm text-gray-600">{students.length} students enrolled</p>
                      </div>
                      <button
                        onClick={handleSaveAttendance}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save Attendance
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {students.length === 0 ? (
                      <div className="p-12 text-center">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No students found in this class</p>
                      </div>
                    ) : (
                      students.map((student, index) => (
                        <motion.div
                          key={student.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-6 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {student.name.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">{student.name}</h3>
                                <p className="text-sm text-gray-600">
                                  Roll No: {student.roll_number || 'N/A'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <input
                                type="text"
                                placeholder="Remarks (optional)"
                                value={remarks[student.id] || ''}
                                onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />

                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAttendanceChange(student.id, true)}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                    attendance[student.id]
                                      ? 'bg-green-600 text-white'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  Present
                                </button>
                                <button
                                  onClick={() => handleAttendanceChange(student.id, false)}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                    !attendance[student.id]
                                      ? 'bg-red-600 text-white'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  <XCircle className="w-4 h-4" />
                                  Absent
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
