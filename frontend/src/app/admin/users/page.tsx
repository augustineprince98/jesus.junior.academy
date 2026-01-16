'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminApi, enrollmentApi } from '@/lib/api';
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle,
  XCircle,
  Edit,
  BookOpen,
  X,
  Save,
  Search,
  Filter,
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: string;
  is_active: boolean;
  student_id?: number;
}

interface SchoolClass {
  id: number;
  name: string;
}

interface UserClassInfo {
  user_id: number;
  student_id?: number;
  class?: { id: number; name: string };
  academic_year?: string;
  message?: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [userClassInfo, setUserClassInfo] = useState<UserClassInfo | null>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    loadUsers();
    loadClasses();
  }, [isAuthenticated, user, router]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.listUsers(token!);
      setUsers(data as User[]);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const result = await enrollmentApi.getClasses(token!);
      setClasses(result.classes || []);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const openAssignModal = async (u: User) => {
    setSelectedUser(u);
    setSelectedClassId(null);
    setUserClassInfo(null);
    setShowAssignModal(true);

    // Load user's current class info
    try {
      const info = await enrollmentApi.getUserClass(token!, u.id);
      setUserClassInfo(info);
      if (info.class) {
        setSelectedClassId(info.class.id);
      }
    } catch (error) {
      console.error('Failed to load user class info:', error);
    }
  };

  const handleAssignClass = async () => {
    if (!selectedUser || !selectedClassId) return;

    try {
      setAssigning(true);
      await enrollmentApi.assignUserToClass(token!, {
        user_id: selectedUser.id,
        class_id: selectedClassId,
      });
      setShowAssignModal(false);
      loadUsers(); // Refresh users list
    } catch (error: any) {
      console.error('Failed to assign class:', error);
      alert(error.detail || 'Failed to assign class');
    } finally {
      setAssigning(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-red-100 text-red-700',
      TEACHER: 'bg-blue-100 text-blue-700',
      CLASS_TEACHER: 'bg-indigo-100 text-indigo-700',
      PARENT: 'bg-green-100 text-green-700',
      STUDENT: 'bg-purple-100 text-purple-700',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm);
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <AdminLayout activeSection="users">
      <div className="max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">User Management</h1>
            <p className="text-gray-600">Manage system users and assign classes</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <UserPlus className="w-5 h-5" />
            Add User
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-md mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="TEACHER">Teacher</option>
                <option value="CLASS_TEACHER">Class Teacher</option>
                <option value="PARENT">Parent</option>
                <option value="STUDENT">Student</option>
              </select>
            </div>
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {u.role === 'ADMIN' && <Shield className="w-4 h-4 text-red-600" />}
                        <span className="font-medium text-gray-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{u.phone}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.is_active ? (
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
                      {(u.role === 'STUDENT' || u.role === 'PARENT') && (
                        <button
                          onClick={() => openAssignModal(u)}
                          className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium inline-flex items-center gap-1"
                        >
                          <BookOpen className="w-4 h-4" />
                          Assign Class
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No users found</p>
              </div>
            )}
          </div>
        )}

        {/* Assign Class Modal */}
        {showAssignModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Assign Class</h2>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* User Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    User: <span className="font-semibold text-gray-800">{selectedUser.name}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Role: <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getRoleBadge(selectedUser.role)}`}>
                      {selectedUser.role}
                    </span>
                  </p>
                  {userClassInfo?.class && (
                    <p className="text-sm text-gray-600 mt-2">
                      Current Class: <span className="font-semibold text-blue-600">{userClassInfo.class.name}</span>
                    </p>
                  )}
                </div>

                {/* Class Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Class
                  </label>
                  <select
                    value={selectedClassId || ''}
                    onChange={(e) => setSelectedClassId(Number(e.target.value) || null)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">-- Select Class --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignClass}
                    disabled={!selectedClassId || assigning}
                    className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {assigning ? 'Assigning...' : 'Assign'}
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
