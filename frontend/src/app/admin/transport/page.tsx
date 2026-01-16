'use client';

/**
 * Transport Management - Admin Panel
 *
 * Manage student transport status and charges class-wise
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import AdminLayout from '@/components/admin/AdminLayout';
import { transportApi, schoolApi } from '@/lib/api';
import {
  Bus,
  Search,
  Building,
  Calendar,
  Users,
  Save,
  CheckCircle,
  XCircle,
  IndianRupee,
  AlertCircle,
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

interface StudentTransport {
  student_id: number;
  student_name: string;
  admission_number: string;
  uses_transport: boolean;
  transport_chargess: number;
}

export default function TransportManagementPage() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuthStore();

  // Data states
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [students, setStudents] = useState<StudentTransport[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Track changes for bulk save
  const [changes, setChanges] = useState<Map<number, { uses_transport?: boolean; transport_charges?: number }>>(
    new Map()
  );

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    loadInitialData();
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (selectedClass && selectedYear && token) {
      loadStudents();
    }
  }, [selectedClass, selectedYear, token]);

  const loadInitialData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [classesData, yearsData] = await Promise.all([
        schoolApi.getClasses(token),
        schoolApi.getAcademicYears(token),
      ]);
      setClasses(classesData);
      setAcademicYears(yearsData);

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

  const loadStudents = async () => {
    if (!token || !selectedClass || !selectedYear) return;
    try {
      setLoading(true);
      setChanges(new Map());
      const data = await transportApi.getClassTransport(token, selectedClass, selectedYear);
      setStudents((data as any).students || []);
    } catch (error) {
      console.error('Failed to load students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTransportToggle = (studentId: number, currentValue: boolean) => {
    const newChanges = new Map(changes);
    const existingChange = newChanges.get(studentId) || {};
    newChanges.set(studentId, { ...existingChange, uses_transport: !currentValue });
    setChanges(newChanges);

    // Update local state for immediate feedback
    setStudents(
      students.map((s) =>
        s.student_id === studentId ? { ...s, uses_transport: !currentValue } : s
      )
    );
  };

  const handleChargeChange = (studentId: number, charge: number) => {
    const newChanges = new Map(changes);
    const existingChange = newChanges.get(studentId) || {};
    newChanges.set(studentId, { ...existingChange, transport_charges: charge });
    setChanges(newChanges);

    // Update local state
    setStudents(
      students.map((s) =>
        s.student_id === studentId ? { ...s, transport_charges: charge } : s
      )
    );
  };

  const handleSaveChanges = async () => {
    if (!token || changes.size === 0) return;

    try {
      setSaving(true);
      setMessage(null);

      // Prepare updates array
      const updates = Array.from(changes.entries()).map(([studentId, change]) => {
        const student = students.find((s) => s.student_id === studentId);
        return {
          student_id: studentId,
          uses_transport: change.uses_transport ?? student?.uses_transport ?? false,
          transport_charges: change.transport_charges ?? student?.transport_charges ?? 0,
        };
      });

      await transportApi.bulkUpdateTransport(token, updates, selectedYear || undefined);

      setMessage({ type: 'success', text: `Successfully updated ${updates.length} student(s)` });
      setChanges(new Map());

      // Refresh data
      loadStudents();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.detail || 'Failed to save changes' });
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = (useTransport: boolean) => {
    const newChanges = new Map(changes);
    students.forEach((student) => {
      const existingChange = newChanges.get(student.student_id) || {};
      newChanges.set(student.student_id, { ...existingChange, uses_transport: useTransport });
    });
    setChanges(newChanges);

    setStudents(students.map((s) => ({ ...s, uses_transport: useTransport })));
  };

  const handleSetChargeForAll = (charge: number) => {
    const newChanges = new Map(changes);
    students
      .filter((s) => s.uses_transport)
      .forEach((student) => {
        const existingChange = newChanges.get(student.student_id) || {};
        newChanges.set(student.student_id, { ...existingChange, transport_charges: charge });
      });
    setChanges(newChanges);

    setStudents(
      students.map((s) => (s.uses_transport ? { ...s, transport_charges: charge } : s))
    );
  };

  const filteredStudents = students.filter(
    (student) =>
      student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admission_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: students.length,
    usingTransport: students.filter((s) => s.uses_transport).length,
    totalCharges: students.filter((s) => s.uses_transport).reduce((sum, s) => sum + s.transport_charges, 0),
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <AdminLayout activeSection="transport">
      <div className="max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Transport Management</h1>
            <p className="text-gray-600">Manage student transport status and charges class-wise</p>
          </div>

          {changes.size > 0 && (
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold inline-flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Save Changes ({changes.size})
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
            <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Select Class & Year</h3>
            <p className="text-gray-500">Choose a class and academic year to manage transport</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-md">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Students Found</h3>
            <p className="text-gray-500">No students are enrolled in this class for the selected year</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md">
            {/* Stats */}
            <div className="p-6 border-b border-gray-200">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600">Total Students</p>
                      <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Bus className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600">Using Transport</p>
                      <p className="text-2xl font-bold text-green-700">{stats.usingTransport}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <IndianRupee className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-purple-600">Total Charges</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0,
                        }).format(stats.totalCharges)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Search */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSelectAll(true)}
                    className="px-4 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-semibold"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => handleSelectAll(false)}
                    className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-semibold"
                  >
                    Deselect All
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Set charge for selected:</span>
                    <input
                      type="number"
                      placeholder="Amount"
                      min="0"
                      className="w-28 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const value = Number((e.target as HTMLInputElement).value);
                          if (value >= 0) handleSetChargeForAll(value);
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Admission No.
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                      Uses Transport
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                      Monthly Charge
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.student_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {student.student_name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {student.admission_number || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            handleTransportToggle(student.student_id, student.uses_transport)
                          }
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                            student.uses_transport
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {student.uses_transport ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Yes
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              No
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center">
                          <span className="text-gray-400 mr-1">₹</span>
                          <input
                            type="number"
                            value={student.transport_charges}
                            onChange={(e) =>
                              handleChargeChange(student.student_id, Number(e.target.value))
                            }
                            disabled={!student.uses_transport}
                            min="0"
                            className={`w-24 px-3 py-2 text-center border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                              student.uses_transport
                                ? 'border-gray-300 bg-white'
                                : 'border-gray-200 bg-gray-50 text-gray-400'
                            }`}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No students match your search</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
