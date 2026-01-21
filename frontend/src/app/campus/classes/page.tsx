'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  ClipboardList,
  PlusCircle,
} from 'lucide-react';

interface ClassInfo {
  id: number;
  name: string;
  section: string;
  total_students: number;
  subjects: string[];
  is_class_teacher: boolean;
}

interface Student {
  id: number;
  name: string;
  roll_number: string;
  attendance_percentage: number;
  last_attendance: string;
}

export default function ClassesPage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuthStore();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Only teachers and admin can access this page
    if (user?.role !== 'TEACHER' && user?.role !== 'CLASS_TEACHER' && user?.role !== 'ADMIN') {
      router.push('/campus');
      return;
    }

    loadClasses();
  }, [isAuthenticated, router, user]);

  const loadClasses = async () => {
    // Mock data for now - will be replaced with actual API call
    setLoading(true);
    try {
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockClasses: ClassInfo[] = [
        {
          id: 1,
          name: 'Class 5',
          section: 'A',
          total_students: 35,
          subjects: ['Mathematics', 'Science', 'English'],
          is_class_teacher: true,
        },
        {
          id: 2,
          name: 'Class 6',
          section: 'B',
          total_students: 32,
          subjects: ['Mathematics'],
          is_class_teacher: false,
        },
        {
          id: 3,
          name: 'Class 7',
          section: 'A',
          total_students: 30,
          subjects: ['Mathematics', 'Science'],
          is_class_teacher: false,
        },
      ];

      setClasses(mockClasses);
    } catch (err: any) {
      setError(err.detail || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (classId: number) => {
    // Mock data for students
    const mockStudents: Student[] = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Student ${i + 1}`,
      roll_number: `${classId}0${i + 1}`,
      attendance_percentage: Math.floor(Math.random() * 30) + 70,
      last_attendance: new Date().toISOString().split('T')[0],
    }));

    setStudents(mockStudents);
  };

  const handleClassSelect = (classInfo: ClassInfo) => {
    setSelectedClass(classInfo);
    loadStudents(classInfo.id);
  };

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => selectedClass ? setSelectedClass(null) : router.push('/campus')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {selectedClass ? `${selectedClass.name} ${selectedClass.section}` : 'My Classes'}
                </h1>
                <p className="text-xs text-gray-500">
                  {selectedClass ? `${selectedClass.total_students} students` : 'Manage your classes'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadClasses}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : !selectedClass ? (
          /* Class List View */
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {classes.map((classInfo, index) => (
                <motion.button
                  key={classInfo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleClassSelect(classInfo)}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    {classInfo.is_class_teacher && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                        Class Teacher
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {classInfo.name} - {classInfo.section}
                  </h3>

                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{classInfo.total_students} students</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {classInfo.subjects.map(subject => (
                      <span
                        key={subject}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center text-indigo-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>View Details</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </div>
        ) : (
          /* Class Detail View */
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <button
                onClick={() => router.push('/campus/attendance')}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Mark Attendance</p>
                  <p className="text-xs text-gray-500">Take roll call</p>
                </div>
              </button>

              <button className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Upload Marks</p>
                  <p className="text-xs text-gray-500">Enter exam results</p>
                </div>
              </button>

              <button
                onClick={() => router.push('/campus/homework')}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Assign Homework</p>
                  <p className="text-xs text-gray-500">Create assignment</p>
                </div>
              </button>

              <button className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">View Reports</p>
                  <p className="text-xs text-gray-500">Class analytics</p>
                </div>
              </button>
            </motion.div>

            {/* Student List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Students</h2>
                <button className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700">
                  <PlusCircle className="w-4 h-4" />
                  Add Student
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Roll No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Attendance
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-gray-600">{student.roll_number}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-indigo-600 font-medium text-sm">
                                {student.name.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  student.attendance_percentage >= 75 ? 'bg-green-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${student.attendance_percentage}%` }}
                              ></div>
                            </div>
                            <span className={`text-sm font-medium ${
                              student.attendance_percentage >= 75 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {student.attendance_percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                            View Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
