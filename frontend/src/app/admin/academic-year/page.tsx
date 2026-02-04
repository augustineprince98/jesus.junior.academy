'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Calendar,
  Plus,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  X,
  Save,
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/runtime-config';

interface AcademicYear {
  id: number;
  year: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  classes_count: number;
  enrollments_count: number;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AcademicYearPage() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuthStore();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [formData, setFormData] = useState({
    year: '',
    start_date: '',
    end_date: '',
    is_current: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    loadYears();
  }, [isAuthenticated, user, router]);

  const loadYears = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}/academic-years/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setYears(Array.isArray(data) ? data : []);
      } else {
        const errData = await response.json().catch(() => null);
        setError(errData?.detail || 'Failed to load academic years');
      }
    } catch (err) {
      console.error('Failed to load academic years:', err);
      setError('Failed to load academic years. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingYear(null);
    setFormData({ year: '', start_date: '', end_date: '', is_current: false });
    setShowModal(true);
    setError('');
  };

  const openEditModal = (year: AcademicYear) => {
    setEditingYear(year);
    setFormData({
      year: year.year,
      start_date: year.start_date,
      end_date: year.end_date,
      is_current: year.is_current,
    });
    setShowModal(true);
    setError('');
  };

  const handleYearLabelChange = (value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, year: value };

      // Auto-fill dates when a valid year label is entered (e.g. "2025-2026")
      const match = value.match(/^(\d{4})-(\d{4})$/);
      if (match) {
        const startYear = parseInt(match[1]);
        const endYear = parseInt(match[2]);
        if (endYear === startYear + 1) {
          // Default: April 1 to March 31 (Indian academic year)
          if (!prev.start_date) {
            updated.start_date = `${startYear}-04-01`;
          }
          if (!prev.end_date) {
            updated.end_date = `${endYear}-03-31`;
          }
        }
      }

      return updated;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.year) {
      setError('Please enter a year');
      return;
    }
    if (!formData.start_date || !formData.end_date) {
      setError('Please enter both start and end dates');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const url = editingYear
        ? `${API_BASE_URL}/academic-years/${editingYear.id}`
        : `${API_BASE_URL}/academic-years/`;

      const response = await fetch(url, {
        method: editingYear ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        loadYears();
      } else {
        const data = await response.json().catch(() => null);
        setError(data?.detail || 'Failed to save academic year');
      }
    } catch (err) {
      console.error('Failed to save academic year:', err);
      setError('Failed to save academic year');
    } finally {
      setSaving(false);
    }
  };

  const handleSetActive = async (yearId: number) => {
    try {
      setError('');
      const response = await fetch(`${API_BASE_URL}/academic-years/${yearId}/set-active`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        loadYears();
      } else {
        const data = await response.json().catch(() => null);
        setError(data?.detail || 'Failed to set active year');
      }
    } catch (err) {
      console.error('Failed to set active year:', err);
      setError('Failed to set active year');
    }
  };

  const handleDelete = async (yearId: number) => {
    if (!confirm('Are you sure you want to delete this academic year?')) return;

    try {
      setError('');
      const response = await fetch(`${API_BASE_URL}/academic-years/${yearId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        loadYears();
      } else {
        const data = await response.json().catch(() => null);
        setError(data?.detail || 'Failed to delete academic year');
      }
    } catch (err) {
      console.error('Failed to delete academic year:', err);
      setError('Failed to delete academic year');
    }
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <AdminLayout activeSection="academic-year">
      <div className="max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Academic Year Management</h1>
            <p className="text-gray-600">Manage academic years and set the current active year</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            Add Academic Year
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Year</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Duration</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Classes</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Enrollments</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {years.map((year) => (
                  <tr key={year.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary-600" />
                        <span className="font-semibold text-gray-800">{year.year}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(year.start_date)} — {formatDate(year.end_date)}
                    </td>
                    <td className="px-6 py-4">
                      {year.is_current ? (
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
                    <td className="px-6 py-4 text-gray-600">{year.classes_count}</td>
                    <td className="px-6 py-4 text-gray-600">{year.enrollments_count}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {!year.is_current && (
                          <button
                            onClick={() => handleSetActive(year.id)}
                            className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium"
                          >
                            Set Active
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(year)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {year.classes_count === 0 && year.enrollments_count === 0 && !year.is_current && (
                          <button
                            onClick={() => handleDelete(year.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {years.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No academic years found</p>
                <p className="text-sm mt-1">Click &quot;Add Academic Year&quot; to create one</p>
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingYear ? 'Edit Academic Year' : 'Add Academic Year'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Year Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => handleYearLabelChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="2025-2026"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: YYYY-YYYY (e.g., 2025-2026)</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Indian academic year: April 1 to March 31 (auto-filled when you enter the year label)
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_current"
                    checked={formData.is_current}
                    onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="is_current" className="text-sm font-medium text-gray-700">
                    Set as current active year
                  </label>
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
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save'}
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
