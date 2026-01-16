'use client';

/**
 * Teacher Subject Assignment - Admin Panel
 *
 * Assign teachers to teach specific subjects in specific classes
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import AdminLayout from '@/components/admin/AdminLayout';
import { teacherSubjectsApi, schoolApi, usersApi } from '@/lib/api';
import {
  BookOpenCheck,
  Search,
  Building,
  Calendar,
  Users,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
  GraduationCap,
  BookOpen,
} from 'lucide-react';

interface SchoolClass {
  id: number;
  name: string;
  section?: string;
}

interface AcademicYear {
  id: number;
  name: string;
  is_current: boolean;
}

interface Subject {
  id: number;
  name: string;
}

interface Teacher {
  id: number;
  name: string;
  email?: string;
  role: string;
}

interface Assignment {
  id: number;
  teacher_id: number;
  teacher_name: string;
  subject_id: number;
  subject_name: string;
}

export default function TeacherSubjectsPage() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuthStore();

  // Data states
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [selectedTeacher, setSelectedTeacher] = useState<number>(0);
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    loadInitialData();
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (selectedClass && selectedYear && token) {
      loadAssignments();
    }
  }, [selectedClass, selectedYear, token]);

  const loadInitialData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [classesData, yearsData, subjectsData, usersData] = await Promise.all([
        schoolApi.getClasses(token),
        schoolApi.getAcademicYears(token),
        schoolApi.getSubjects(token),
        usersApi.getUsers(token),
      ]);
      setClasses(classesData);
      setAcademicYears(yearsData);
      setSubjects(subjectsData);

      // Filter only teachers
      const teacherUsers = (usersData as any[]).filter(
        (u: any) => u.role === 'TEACHER' || u.role === 'CLASS_TEACHER'
      );
      setTeachers(teacherUsers);

      // Auto-select current academic year
      const currentYear = yearsData.find((y: AcademicYear) => y.is_current);
      if (currentYear) {
        setSelectedYear(currentYear.id);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    if (!token || !selectedClass || !selectedYear) return;
    try {
      setLoading(true);
      const data = await teacherSubjectsApi.getClassAssignments(
        token,
        selectedClass,
        selectedYear
      );
      setAssignments((data as any).assignments || []);
    } catch (error) {
      console.error('Failed to load assignments:', error);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!token || !selectedClass || !selectedYear || !selectedTeacher || selectedSubjects.length === 0) {
      return;
    }

    try {
      setAssigning(true);
      setMessage(null);

      await teacherSubjectsApi.bulkAssign(token, {
        teacher_id: selectedTeacher,
        class_id: selectedClass,
        subject_ids: selectedSubjects,
        academic_year_id: selectedYear,
      });

      setMessage({ type: 'success', text: 'Teacher assigned successfully!' });
      setShowModal(false);
      setSelectedTeacher(0);
      setSelectedSubjects([]);
      loadAssignments();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.detail || 'Failed to assign teacher' });
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    if (!token) return;

    try {
      await teacherSubjectsApi.removeAssignment(token, assignmentId);
      setMessage({ type: 'success', text: 'Assignment removed' });
      loadAssignments();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.detail || 'Failed to remove assignment' });
    }
  };

  const toggleSubjectSelection = (subjectId: number) => {
    if (selectedSubjects.includes(subjectId)) {
      setSelectedSubjects(selectedSubjects.filter((id) => id !== subjectId));
    } else {
      setSelectedSubjects([...selectedSubjects, subjectId]);
    }
  };

  const openAssignModal = () => {
    setSelectedTeacher(0);
    setSelectedSubjects([]);
    setShowModal(true);
  };

  // Group assignments by teacher
  const groupedAssignments = assignments.reduce((acc, assignment) => {
    if (!acc[assignment.teacher_id]) {
      acc[assignment.teacher_id] = {
        teacher_id: assignment.teacher_id,
        teacher_name: assignment.teacher_name,
        subjects: [],
      };
    }
    acc[assignment.teacher_id].subjects.push({
      id: assignment.id,
      subject_id: assignment.subject_id,
      subject_name: assignment.subject_name,
    });
    return acc;
  }, {} as Record<number, { teacher_id: number; teacher_name: string; subjects: { id: number; subject_id: number; subject_name: string }[] }>);

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <AdminLayout activeSection="teacher-subjects">
      <div className="max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Teacher Subject Assignment</h1>
            <p className="text-gray-600">Assign teachers to subjects in each class</p>
          </div>

          {selectedClass && selectedYear && (
            <button
              onClick={openAssignModal}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Assign Teacher
            </button>
          )}
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}

        {/* Class & Year Selector */}
        <div className="bg-white rounded-xl p-6 shadow-md mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Building className="w-4 h-4 inline mr-2" />
                Select Class
              </label>
              <select
                value={selectedClass || ''}
                onChange={(e) => setSelectedClass(Number(e.target.value) || null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">-- Select Class --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.section ? `- ${cls.section}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Academic Year
              </label>
              <select
                value={selectedYear || ''}
                onChange={(e) => setSelectedYear(Number(e.target.value) || null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">-- Select Year --</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name} {year.is_current ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {!selectedClass || !selectedYear ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-md">
            <BookOpenCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Select Class & Year</h3>
            <p className="text-gray-500">Choose a class and academic year to manage teacher assignments</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : Object.keys(groupedAssignments).length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-md">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Assignments Yet</h3>
            <p className="text-gray-500 mb-6">No teachers have been assigned to this class yet</p>
            <button
              onClick={openAssignModal}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Assign First Teacher
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.values(groupedAssignments).map((teacher) => (
              <div key={teacher.teacher_id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{teacher.teacher_name}</h3>
                      <p className="text-primary-100 text-sm">
                        {teacher.subjects.length} subject(s) assigned
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  {teacher.subjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary-600" />
                        <span className="font-medium text-gray-700">{subject.subject_name}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveAssignment(subject.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Assign Teacher Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Assign Teacher to Subjects</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Teacher Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Teacher
                  </label>
                  <select
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value={0}>-- Select a Teacher --</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name} ({teacher.role === 'CLASS_TEACHER' ? 'Class Teacher' : 'Teacher'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Subjects
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {subjects.map((subject) => {
                      const isSelected = selectedSubjects.includes(subject.id);
                      return (
                        <button
                          key={subject.id}
                          onClick={() => toggleSubjectSelection(subject.id)}
                          className={`flex items-center gap-2 p-3 rounded-lg text-left transition-colors ${
                            isSelected
                              ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                              : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'
                          }`}
                        >
                          {isSelected ? (
                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium">{subject.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedSubjects.length > 0 && (
                    <p className="mt-2 text-sm text-primary-600">
                      {selectedSubjects.length} subject(s) selected
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssign}
                    disabled={assigning || !selectedTeacher || selectedSubjects.length === 0}
                    className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {assigning ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                    Assign
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
