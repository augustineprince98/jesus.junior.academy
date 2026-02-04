'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import AdminLayout from '@/components/admin/AdminLayout';
import YearSelector from '@/components/admin/YearSelector';
import {
  FileSpreadsheet,
  Users,
  BookOpen,
  Save,
  Search,
  CheckCircle,
  X,
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/runtime-config';

interface SchoolClass {
  id: number;
  name: string;
  section?: string;
}

interface Subject {
  id: number;
  name: string;
}

interface Exam {
  id: number;
  name: string;
  exam_type: string;
}

interface Student {
  id: number;
  name: string;
  roll_number?: string;
}

interface MarkEntry {
  student_id: number;
  marks: number | null;
}

export default function MarksPage() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuthStore();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [academicYearId, setAcademicYearId] = useState<number | null>(null);

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [marks, setMarks] = useState<Record<number, number | null>>({});

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    loadInitialData();
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (selectedClassId && academicYearId) {
      loadClassData();
    }
  }, [selectedClassId, academicYearId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Get current academic year
      const yearRes = await fetch(`${API_BASE_URL}/academic-years/current`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (yearRes.ok) {
        const yearData = await yearRes.json();
        setAcademicYearId(yearData.id);
      }

      // Get classes
      const classesRes = await fetch(`${API_BASE_URL}/enrollment/classes`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setClasses(classesData.classes || []);
      }

      // Get subjects
      const subjectsRes = await fetch(`${API_BASE_URL}/subjects/`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (subjectsRes.ok) {
        const subjectsData = await subjectsRes.json();
        setSubjects(subjectsData || []);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadClassData = async () => {
    if (!selectedClassId || !academicYearId) return;

    try {
      setLoading(true);

      // Get students
      const studentsRes = await fetch(
        `${API_BASE_URL}/enrollment/class/${selectedClassId}/students?academic_year_id=${academicYearId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }
      );
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData.students || []);
        // Initialize marks
        const initialMarks: Record<number, number | null> = {};
        (studentsData.students || []).forEach((s: Student) => {
          initialMarks[s.id] = null;
        });
        setMarks(initialMarks);
      }

      // Get exams for the class
      const examsRes = await fetch(
        `${API_BASE_URL}/admin/classes/${selectedClassId}/exams?academic_year_id=${academicYearId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }
      );
      if (examsRes.ok) {
        const examsData = await examsRes.json();
        setExams(examsData.exams || []);
      }
    } catch (err) {
      console.error('Failed to load class data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId: number, value: string) => {
    const numValue = value === '' ? null : parseInt(value, 10);
    if (numValue !== null && (numValue < 0 || numValue > maxMarks)) return;
    setMarks((prev) => ({ ...prev, [studentId]: numValue }));
  };

  const handleSaveMarks = async () => {
    if (!selectedClassId || !selectedSubjectId || !selectedExamId) {
      setError('Please select class, subject, and exam');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      let savedCount = 0;
      let errorCount = 0;

      for (const student of students) {
        const marksValue = marks[student.id];
        if (marksValue === null || marksValue === undefined) continue;

        try {
          const response = await fetch(`${API_BASE_URL}/marks/enter`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            credentials: 'include',
            body: JSON.stringify({
              student_id: student.id,
              exam_id: selectedExamId,
              subject_id: selectedSubjectId,
              marks_obtained: marksValue,
            }),
          });

          if (response.ok) {
            savedCount++;
          } else {
            errorCount++;
          }
        } catch (err) {
          errorCount++;
        }
      }

      if (savedCount > 0) {
        setSuccess(`Successfully saved marks for ${savedCount} students`);
      }
      if (errorCount > 0) {
        setError(`Failed to save marks for ${errorCount} students`);
      }
    } catch (err) {
      console.error('Failed to save marks:', err);
      setError('Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <AdminLayout activeSection="marks">
      <div className="max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Upload Marks</h1>
            <p className="text-gray-600">Enter student marks for exams</p>
          </div>
          <YearSelector
            selectedYearId={academicYearId}
            onChange={setAcademicYearId}
          />
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
            {error}
            <button onClick={() => setError('')}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex justify-between items-center">
            {success}
            <button onClick={() => setSuccess('')}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Selection Controls */}
        <div className="bg-white rounded-xl p-6 shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Class
              </label>
              <select
                value={selectedClassId || ''}
                onChange={(e) => {
                  setSelectedClassId(Number(e.target.value) || null);
                  setSelectedExamId(null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.section ? `(${cls.section})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Exam
              </label>
              <select
                value={selectedExamId || ''}
                onChange={(e) => setSelectedExamId(Number(e.target.value) || null)}
                disabled={!selectedClassId || exams.length === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              >
                <option value="">Select Exam</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name} ({exam.exam_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subject
              </label>
              <select
                value={selectedSubjectId || ''}
                onChange={(e) => setSelectedSubjectId(Number(e.target.value) || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Max Marks
              </label>
              <input
                type="number"
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value) || 100)}
                min={1}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Marks Entry Table */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : !selectedClassId ? (
          <div className="bg-white rounded-xl p-12 shadow-md text-center text-gray-500">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Select a class to enter marks</p>
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-md text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No students found in this class</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">#</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Roll No</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Student Name</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    Marks (out of {maxMarks})
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                    <td className="px-6 py-4 text-gray-600">{student.roll_number || '-'}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{student.name}</td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="number"
                        value={marks[student.id] ?? ''}
                        onChange={(e) => handleMarkChange(student.id, e.target.value)}
                        min={0}
                        max={maxMarks}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-primary-500"
                        placeholder="-"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={handleSaveMarks}
                disabled={saving || !selectedExamId || !selectedSubjectId}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Marks'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
