'use client';

/**
 * Fee Management - Admin Panel
 *
 * Manage fee structures, student fee profiles, and track payments
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminFeesApi, schoolApi } from '@/lib/api';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  IndianRupee,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Save,
  ChevronDown,
  Building,
  Calendar,
  Wallet,
  Receipt,
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

interface FeeStructure {
  id: number;
  class_id: number;
  academic_year_id: number;
  annual_charges: number;
  monthly_fee: number;
  yearly_tuition: number;
  created_at: string;
}

interface ClassFeeSummary {
  class_summary: {
    total_students: number;
    total_expected: number;
    total_collected: number;
    total_pending: number;
    collection_percentage: number;
  };
  students: {
    student_id: number;
    student_name: string;
    total_fee: number;
    paid: number;
    pending: number;
    status: 'PAID' | 'PENDING' | 'PARTIAL';
  }[];
}

// Payment frequencies
const PAYMENT_FREQUENCIES = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'HALF_YEARLY', label: 'Half Yearly' },
  { value: 'YEARLY', label: 'Yearly' },
];

export default function FeeManagementPage() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuthStore();

  // Data states
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [feeStructure, setFeeStructure] = useState<FeeStructure | null>(null);
  const [classSummary, setClassSummary] = useState<ClassFeeSummary | null>(null);

  // UI states
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'structure' | 'students' | 'payments'>('structure');
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [structureForm, setStructureForm] = useState({
    annual_charges: 0,
    monthly_fee: 0,
  });

  const [paymentForm, setPaymentForm] = useState({
    student_fee_profile_id: 0,
    student_name: '',
    amount_paid: 0,
    payment_frequency: 'MONTHLY',
    receipt_number: '',
    remarks: '',
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    loadInitialData();
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (selectedClass && selectedYear && token) {
      loadFeeData();
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

  const loadFeeData = async () => {
    if (!token || !selectedClass || !selectedYear) return;
    try {
      setLoading(true);

      // Try to get fee structure
      try {
        const structure = await adminFeesApi.getFeeStructureByClassYear(
          token,
          selectedClass,
          selectedYear
        );
        setFeeStructure(structure as FeeStructure);

        // Load class summary if structure exists
        const summary = await adminFeesApi.getClassFeeSummary(
          token,
          selectedClass,
          selectedYear
        );
        setClassSummary(summary as ClassFeeSummary);
      } catch {
        // No fee structure exists yet
        setFeeStructure(null);
        setClassSummary(null);
      }
    } catch (error) {
      console.error('Failed to load fee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedClass || !selectedYear) return;

    try {
      await adminFeesApi.createFeeStructure(token, {
        class_id: selectedClass,
        academic_year_id: selectedYear,
        annual_charges: structureForm.annual_charges,
        monthly_fee: structureForm.monthly_fee,
      });
      setShowStructureModal(false);
      loadFeeData();
    } catch (error) {
      console.error('Failed to create fee structure:', error);
      alert('Failed to create fee structure. It may already exist.');
    }
  };

  const handleUpdateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !feeStructure) return;

    try {
      await adminFeesApi.updateFeeStructure(token, feeStructure.id, {
        annual_charges: structureForm.annual_charges,
        monthly_fee: structureForm.monthly_fee,
      });
      setShowStructureModal(false);
      loadFeeData();
    } catch (error) {
      console.error('Failed to update fee structure:', error);
      alert('Failed to update fee structure.');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      await adminFeesApi.recordCashPayment(token, {
        student_fee_profile_id: paymentForm.student_fee_profile_id,
        amount_paid: paymentForm.amount_paid,
        payment_frequency: paymentForm.payment_frequency,
        receipt_number: paymentForm.receipt_number || undefined,
        remarks: paymentForm.remarks || undefined,
      });
      setShowPaymentModal(false);
      setPaymentForm({
        student_fee_profile_id: 0,
        student_name: '',
        amount_paid: 0,
        payment_frequency: 'MONTHLY',
        receipt_number: '',
        remarks: '',
      });
      loadFeeData();
    } catch (error) {
      console.error('Failed to record payment:', error);
      alert('Failed to record payment.');
    }
  };

  const openEditStructure = () => {
    if (feeStructure) {
      setStructureForm({
        annual_charges: feeStructure.annual_charges,
        monthly_fee: feeStructure.monthly_fee,
      });
    } else {
      setStructureForm({ annual_charges: 0, monthly_fee: 0 });
    }
    setShowStructureModal(true);
  };

  const openPaymentModal = (student: ClassFeeSummary['students'][0]) => {
    setPaymentForm({
      student_fee_profile_id: student.student_id,
      student_name: student.student_name,
      amount_paid: 0,
      payment_frequency: 'MONTHLY',
      receipt_number: '',
      remarks: '',
    });
    setShowPaymentModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Paid
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" /> Partial
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  const filteredStudents = classSummary?.students.filter((student) =>
    student.student_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <AdminLayout activeSection="fees">
      <div className="max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Fee Management</h1>
            <p className="text-gray-600">Manage fee structures and track student payments</p>
          </div>
        </div>

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
            <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Select Class & Year</h3>
            <p className="text-gray-500">Choose a class and academic year to manage fees</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : !feeStructure ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-md">
            <IndianRupee className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Fee Structure</h3>
            <p className="text-gray-500 mb-6">
              Create a fee structure for this class and academic year
            </p>
            <button
              onClick={openEditStructure}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Fee Structure
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-md mb-6">
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('structure')}
                    className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                      activeTab === 'structure'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Fee Structure
                  </button>
                  <button
                    onClick={() => setActiveTab('students')}
                    className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                      activeTab === 'students'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Students ({classSummary?.students.length || 0})
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'structure' && (
                  <div>
                    {/* Summary Cards */}
                    {classSummary && (
                      <div className="grid md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <Users className="w-8 h-8 text-blue-600" />
                            <div>
                              <p className="text-sm text-blue-600">Total Students</p>
                              <p className="text-2xl font-bold text-blue-700">
                                {classSummary.class_summary.total_students}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <IndianRupee className="w-8 h-8 text-purple-600" />
                            <div>
                              <p className="text-sm text-purple-600">Total Expected</p>
                              <p className="text-2xl font-bold text-purple-700">
                                {formatCurrency(classSummary.class_summary.total_expected)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                            <div>
                              <p className="text-sm text-green-600">Collected</p>
                              <p className="text-2xl font-bold text-green-700">
                                {formatCurrency(classSummary.class_summary.total_collected)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-red-50 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                            <div>
                              <p className="text-sm text-red-600">Pending</p>
                              <p className="text-2xl font-bold text-red-700">
                                {formatCurrency(classSummary.class_summary.total_pending)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fee Structure Details */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Fee Breakdown</h3>
                        <button
                          onClick={openEditStructure}
                          className="px-4 py-2 text-sm bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors font-semibold inline-flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <p className="text-sm text-gray-500 mb-1">Annual Charges</p>
                          <p className="text-xl font-bold text-gray-800">
                            {formatCurrency(feeStructure.annual_charges)}
                          </p>
                          <p className="text-xs text-gray-400">One-time yearly charges</p>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <p className="text-sm text-gray-500 mb-1">Monthly Fee</p>
                          <p className="text-xl font-bold text-gray-800">
                            {formatCurrency(feeStructure.monthly_fee)}
                          </p>
                          <p className="text-xs text-gray-400">Per month tuition</p>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-primary-200 bg-primary-50">
                          <p className="text-sm text-primary-600 mb-1">Total Yearly Fee</p>
                          <p className="text-xl font-bold text-primary-700">
                            {formatCurrency(feeStructure.annual_charges + feeStructure.monthly_fee * 12)}
                          </p>
                          <p className="text-xs text-primary-500">Annual + 12 months tuition</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'students' && (
                  <div>
                    {/* Search Bar */}
                    <div className="flex gap-4 mb-4">
                      <div className="flex-1 relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search students..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>

                    {/* Students Table */}
                    {filteredStudents && filteredStudents.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                Student Name
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                Total Fee
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                Paid
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                Pending
                              </th>
                              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                                Status
                              </th>
                              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {filteredStudents.map((student) => (
                              <tr key={student.student_id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-800">
                                  {student.student_name}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-600">
                                  {formatCurrency(student.total_fee)}
                                </td>
                                <td className="px-4 py-3 text-right text-green-600 font-medium">
                                  {formatCurrency(student.paid)}
                                </td>
                                <td className="px-4 py-3 text-right text-red-600 font-medium">
                                  {formatCurrency(student.pending)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {getStatusBadge(student.status)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => openPaymentModal(student)}
                                    className="px-3 py-1 text-sm bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors font-semibold"
                                  >
                                    <Receipt className="w-4 h-4 inline mr-1" />
                                    Record Payment
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No students found with fee profiles</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Fee Structure Modal */}
        {showStructureModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                  {feeStructure ? 'Edit Fee Structure' : 'Create Fee Structure'}
                </h2>
                <button
                  onClick={() => setShowStructureModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={feeStructure ? handleUpdateStructure : handleCreateStructure} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Annual Charges (One-time)
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      value={structureForm.annual_charges}
                      onChange={(e) =>
                        setStructureForm({ ...structureForm, annual_charges: Number(e.target.value) })
                      }
                      min="0"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Monthly Fee
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      value={structureForm.monthly_fee}
                      onChange={(e) =>
                        setStructureForm({ ...structureForm, monthly_fee: Number(e.target.value) })
                      }
                      min="1"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    Total Yearly Fee:{' '}
                    <span className="font-bold text-primary-600">
                      {formatCurrency(structureForm.annual_charges + structureForm.monthly_fee * 12)}
                    </span>
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowStructureModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {feeStructure ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Record Payment</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="p-6 space-y-5">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    Student: <span className="font-semibold text-gray-800">{paymentForm.student_name}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount Paid
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      value={paymentForm.amount_paid}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, amount_paid: Number(e.target.value) })
                      }
                      min="1"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter amount"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Frequency
                  </label>
                  <select
                    value={paymentForm.payment_frequency}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, payment_frequency: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {PAYMENT_FREQUENCIES.map((freq) => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Receipt Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentForm.receipt_number}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, receipt_number: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., RCP-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Remarks (Optional)
                  </label>
                  <textarea
                    value={paymentForm.remarks}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, remarks: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    placeholder="Any additional notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Record Payment
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
