'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Save,
} from 'lucide-react';

interface SchoolClass {
  id: number;
  name: string;
  section?: string;
}

interface Student {
  id: number;
  name: string;
  enrollment_id?: number;
}

interface AttendanceRecord {
  student_id: number;
  is_present: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://jja-backend.onrender.com';

export default function AttendancePage() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuthStore();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [academicYearId, setAcademicYearId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    loadClasses();
    loadCurrentAcademicYear();
  }, [isAuthenticated, user, router]);

  const loadCurrentAcademicYear = async () => {
    try {
      const response = await fetch(`${API_BASE}/academic-years/current`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setAcademicYearId(data.id);
      }
    } catch (err) {
      console.error('Failed to load academic year:', err);
    }
  };

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/enrollment/classes`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || []);
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (classId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/enrollment/class/${classId}/students`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const studentList = data.students || [];
        setStudents(studentList);
        // Initialize all as present
        const initialAttendance: Record<number, boolean> = {};
        studentList.forEach((s: Student) => {
          initialAttendance[s.id] = true;
        });
        setAttendance(initialAttendance);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClassSelect = (classId: number) => {
    setSelectedClassId(classId);
    setError('');
    setSuccess('');
    loadStudents(classId);
  };

  const toggleAttendance = (studentId: number) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const markAllPresent = () => {
    const allPresent: Record<number, boolean> = {};
    students.forEach((s) => {
      allPresent[s.id] = true;
    });
    setAttendance(allPresent);
  };

  const markAllAbsent = () => {
    const allAbsent: Record<number, boolean> = {};
    students.forEach((s) => {
      allAbsent[s.id] = false;
    });
    setAttendance(allAbsent);
  };

  const saveAttendance = async () => {
    if (!selectedClassId || !academicYearId) {
      setError('Please select a class and ensure academic year is set');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const records: AttendanceRecord[] = students.map((s) => ({
        student_id: s.id,
        is_present: attendance[s.id] ?? true,
      }));

      const response = await fetch(`${API_BASE}/attendance/mark-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          class_id: selectedClassId,
          academic_year_id: academicYearId,
          date: selectedDate,
          records,
        }),
      });

      if (response.ok) {
        setSuccess('Attendance saved successfully!');
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to save attendance');
      }
    } catch (err) {
      console.error('Failed to save attendance:', err);
      setError('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = students.length - presentCount;

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <AdminLayout activeSection="attendance">
      <div className="max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Attendance Management</h1>
          <p className="text-gray-600">Mark and manage student attendance for any class</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-xl p-6 shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Class
              </label>
              <select
                value={selectedClassId || ''}
                onChange={(e) => handleClassSelect(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Select Class --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.section ? `(${cls.section})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={markAllPresent}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium"
              >
                All Present
              </button>
              <button
                onClick={markAllAbsent}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
              >
                All Absent
              </button>
            </div>
          </div>
        </div>

        {/* Summary */}
        {selectedClassId && students.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-800">{students.length}</p>
                  <p className="text-sm text-gray-500">Total Students</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                  <p className="text-sm text-gray-500">Present</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                  <p className="text-sm text-gray-500">Absent</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Student List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : selectedClassId && students.length > 0 ? (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">#</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Student Name</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{student.name}</td>
                    <td className="px-6 py-4 text-center">
                      {attendance[student.id] ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Present
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                          <XCircle className="w-4 h-4" />
                          Absent
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleAttendance(student.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          attendance[student.id]
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {attendance[student.id] ? 'Mark Absent' : 'Mark Present'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={saveAttendance}
                disabled={saving}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </div>
        ) : selectedClassId ? (
          <div className="bg-white rounded-xl p-12 shadow-md text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No students enrolled in this class</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 shadow-md text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Select a class to mark attendance</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
