'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import AdminLayout from '@/components/admin/AdminLayout';
import YearSelector from '@/components/admin/YearSelector';
import {
  Plus,
  BookOpen,
  Calendar,
  Users,
  Edit,
  Trash2,
  X,
  Save,
  Search,
  Eye,
  Send,
  FileText,
  Clock,
  CheckCircle,
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

interface Homework {
  id: number;
  title: string;
  description: string;
  subject_id: number;
  subject_name: string;
  class_id: number;
  assigned_date: string;
  due_date: string;
  is_published: boolean;
}

export default function HomeworkPage() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuthStore();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [academicYearId, setAcademicYearId] = useState<number | null>(null);

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);

  const [formData, setFormData] = useState({
    class_id: 0,
    subject_id: 0,
    title: '',
    description: '',
    assigned_date: new Date().toISOString().split('T')[0],
    due_date: '',
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    loadInitialData();
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (selectedClassId && academicYearId) {
      loadHomework();
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

  const loadHomework = async () => {
    if (!selectedClassId || !academicYearId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/homework/class/${selectedClassId}/year/${academicYearId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }
      );
      if (response.ok) {
        const data = await response.json();
        setHomework(data.homework || []);
      }
    } catch (err) {
      console.error('Failed to load homework:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !academicYearId) return;

    try {
      setError('');
      setSuccess('');

      if (editingHomework) {
        // Update existing homework
        const response = await fetch(`${API_BASE_URL}/homework/${editingHomework.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            due_date: formData.due_date,
          }),
        });

        if (response.ok) {
          setSuccess('Homework updated successfully');
        } else {
          const data = await response.json();
          setError(data.detail || 'Failed to update homework');
          return;
        }
      } else {
        // Create new homework
        const response = await fetch(`${API_BASE_URL}/homework/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            class_id: formData.class_id,
            subject_id: formData.subject_id,
            academic_year_id: academicYearId,
            title: formData.title,
            description: formData.description,
            assigned_date: formData.assigned_date,
            due_date: formData.due_date,
          }),
        });

        if (response.ok) {
          setSuccess('Homework created successfully');
        } else {
          const data = await response.json();
          setError(data.detail || 'Failed to create homework');
          return;
        }
      }

      setShowModal(false);
      resetForm();
      loadHomework();
    } catch (err) {
      console.error('Failed to save homework:', err);
      setError('Failed to save homework');
    }
  };

  const handlePublish = async (homeworkId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/homework/${homeworkId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ send_individual_notification: false }),
      });

      if (response.ok) {
        setSuccess('Homework published successfully');
        loadHomework();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to publish homework');
      }
    } catch (err) {
      console.error('Failed to publish homework:', err);
      setError('Failed to publish homework');
    }
  };

  const handleDelete = async (homeworkId: number) => {
    if (!confirm('Are you sure you want to delete this homework?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/homework/${homeworkId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });

      if (response.ok) {
        setSuccess('Homework deleted successfully');
        loadHomework();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to delete homework');
      }
    } catch (err) {
      console.error('Failed to delete homework:', err);
      setError('Failed to delete homework');
    }
  };

  const openCreateModal = () => {
    setEditingHomework(null);
    resetForm();
    if (selectedClassId) {
      setFormData((prev) => ({ ...prev, class_id: selectedClassId }));
    }
    setShowModal(true);
  };

  const openEditModal = (hw: Homework) => {
    setEditingHomework(hw);
    setFormData({
      class_id: hw.class_id,
      subject_id: hw.subject_id,
      title: hw.title,
      description: hw.description,
      assigned_date: hw.assigned_date,
      due_date: hw.due_date,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      class_id: selectedClassId || 0,
      subject_id: 0,
      title: '',
      description: '',
      assigned_date: new Date().toISOString().split('T')[0],
      due_date: '',
    });
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <AdminLayout activeSection="homework">
      <div className="max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Homework Management</h1>
            <p className="text-gray-600">Create, manage, and publish homework assignments</p>
          </div>
          <div className="flex gap-3 items-center">
            <YearSelector
              selectedYearId={academicYearId}
              onChange={setAcademicYearId}
            />
            <button
              onClick={openCreateModal}
              disabled={!selectedClassId}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              Add Homework
            </button>
          </div>
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

        {/* Class Selector */}
        <div className="bg-white rounded-xl p-6 shadow-md mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Class
          </label>
          <select
            value={selectedClassId || ''}
            onChange={(e) => setSelectedClassId(Number(e.target.value) || null)}
            className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">-- Select Class --</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} {cls.section ? `(${cls.section})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Homework List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : !selectedClassId ? (
          <div className="bg-white rounded-xl p-12 shadow-md text-center text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Select a class to view and manage homework</p>
          </div>
        ) : homework.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-md text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No homework assignments found for this class</p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Create First Homework
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Subject</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Due Date</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {homework.map((hw) => (
                  <tr key={hw.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{hw.title}</div>
                      <p className="text-sm text-gray-500 truncate max-w-xs">{hw.description}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{hw.subject_name}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(hw.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {hw.is_published ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                          <Clock className="w-4 h-4" />
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {!hw.is_published && (
                          <>
                            <button
                              onClick={() => handlePublish(hw.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Publish"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(hw)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(hw.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {hw.is_published && (
                          <span className="text-sm text-gray-400">Published</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingHomework ? 'Edit Homework' : 'Create Homework'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                {!editingHomework && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Class <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.class_id}
                        onChange={(e) => setFormData({ ...formData, class_id: Number(e.target.value) })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value={0}>Select Class</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name} {cls.section ? `(${cls.section})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.subject_id}
                        onChange={(e) => setFormData({ ...formData, subject_id: Number(e.target.value) })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value={0}>Select Subject</option>
                        {subjects.map((subject) => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Chapter 5 Exercise"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder="Homework instructions..."
                  />
                </div>

                {!editingHomework && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Assigned Date
                    </label>
                    <input
                      type="date"
                      value={formData.assigned_date}
                      onChange={(e) => setFormData({ ...formData, assigned_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {editingHomework ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
