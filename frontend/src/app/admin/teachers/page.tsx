'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Users,
  UserPlus,
  GraduationCap,
  BookOpen,
  CheckCircle,
  XCircle,
  Edit,
  X,
  Save,
  Search,
  Filter,
} from 'lucide-react';

interface Teacher {
  id: number;
  name: string;
  phone: string;
  email?: string;
  qualification?: string;
  specialization?: string;
  is_class_teacher?: boolean;
  assigned_class?: string;
}

interface User {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: string;
  is_active: boolean;
  teacher_id?: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://jja-backend.onrender.com';

export default function TeachersPage() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuthStore();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Add teacher modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    phone: '',
    password: '',
    email: '',
    role: 'TEACHER',
  });
  const [addingTeacher, setAddingTeacher] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    loadTeachers();
  }, [isAuthenticated, user, router]);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      // Get all users with TEACHER or CLASS_TEACHER role
      const response = await fetch(`${API_BASE}/users/?role=TEACHER`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });

      const classTeacherResponse = await fetch(`${API_BASE}/users/?role=CLASS_TEACHER`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });

      if (response.ok && classTeacherResponse.ok) {
        const teacherData = await response.json();
        const classTeacherData = await classTeacherResponse.json();

        const allTeachers = [
          ...(teacherData.users || []),
          ...(classTeacherData.users || []),
        ];
        setTeachers(allTeachers);
      } else {
        setError('Failed to load teachers');
      }
    } catch (err) {
      console.error('Failed to load teachers:', err);
      setError('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setNewTeacher({ name: '', phone: '', password: '', email: '', role: 'TEACHER' });
    setError('');
    setShowAddModal(true);
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacher.name || !newTeacher.phone || !newTeacher.password) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setAddingTeacher(true);
      setError('');

      const response = await fetch(`${API_BASE}/users/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          name: newTeacher.name,
          phone: newTeacher.phone,
          password: newTeacher.password,
          role: newTeacher.role,
          email: newTeacher.email || undefined,
        }),
      });

      if (response.ok) {
        setShowAddModal(false);
        loadTeachers();
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to add teacher');
      }
    } catch (err) {
      console.error('Failed to add teacher:', err);
      setError('Failed to add teacher');
    } finally {
      setAddingTeacher(false);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'CLASS_TEACHER') {
      return 'bg-indigo-100 text-indigo-700';
    }
    return 'bg-blue-100 text-blue-700';
  };

  const filteredTeachers = teachers.filter((t) => {
    return (
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.phone.includes(searchTerm) ||
      (t.email && t.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <AdminLayout activeSection="teachers">
      <div className="max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Teachers Management</h1>
            <p className="text-gray-600">Manage teachers and class teacher assignments</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <UserPlus className="w-5 h-5" />
            Add Teacher
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
            <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">
              <X className="w-4 h-4 inline" />
            </button>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-xl p-4 shadow-md mb-6">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-800">{teacher.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{teacher.phone}</td>
                    <td className="px-6 py-4 text-gray-600">{teacher.email || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadge(teacher.role)}`}>
                        {teacher.role === 'CLASS_TEACHER' ? 'Class Teacher' : 'Teacher'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {teacher.is_active ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400">
                          <XCircle className="w-4 h-4" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => router.push(`/admin/teacher-subjects?teacher_id=${teacher.teacher_id || teacher.id}`)}
                        className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-medium inline-flex items-center gap-1"
                      >
                        <BookOpen className="w-4 h-4" />
                        Subjects
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTeachers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No teachers found</p>
                <p className="text-sm mt-1">Click "Add Teacher" to create one</p>
              </div>
            )}
          </div>
        )}

        {/* Add Teacher Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Add New Teacher</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddTeacher} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTeacher.name}
                    onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter teacher's name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={newTeacher.phone}
                    onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={newTeacher.email}
                    onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newTeacher.password}
                    onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter password (min 6 characters)"
                    minLength={6}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newTeacher.role}
                    onChange={(e) => setNewTeacher({ ...newTeacher, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="TEACHER">Teacher</option>
                    <option value="CLASS_TEACHER">Class Teacher</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {newTeacher.role === 'TEACHER' && 'Can teach subjects and enter marks'}
                    {newTeacher.role === 'CLASS_TEACHER' && 'Teacher + class management + attendance'}
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingTeacher}
                    className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <UserPlus className="w-5 h-5" />
                    {addingTeacher ? 'Adding...' : 'Add Teacher'}
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
