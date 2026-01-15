'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import { feesApi } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  DollarSign,
  CreditCard,
  Receipt,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  AlertCircle,
  IndianRupee,
} from 'lucide-react';

interface FeeProfile {
  student_id: number;
  student_name: string;
  class_name: string;
  annual_charges: number;
  monthly_fee: number;
  transport_charges: number;
  concession_amount: number;
  concession_reason: string | null;
  total_yearly_fee: number;
  total_paid: number;
  balance_due: number;
}

interface Payment {
  id: number;
  amount: number;
  payment_date: string;
  payment_mode: string;
  payment_for: string;
  receipt_number: string;
  is_verified: boolean;
}

export default function FeesPage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuthStore();
  const [feeProfile, setFeeProfile] = useState<FeeProfile | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadFees();
  }, [isAuthenticated, router, token]);

  const loadFees = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      // Depending on role, use different API endpoints
      if (user?.role === 'PARENT' && user?.student_id) {
        const [feesData, paymentsData] = await Promise.all([
          feesApi.getChildFees(token, user.student_id),
          feesApi.getPaymentHistory(token, user.student_id),
        ]);
        setFeeProfile(feesData as FeeProfile);
        setPayments((paymentsData as any).payments || []);
      } else if (user?.role === 'STUDENT') {
        const feesData = await feesApi.getMyFees(token);
        setFeeProfile(feesData as FeeProfile);
        // Students might not have direct access to payments
      }
    } catch (err: any) {
      setError(err.detail || 'Failed to load fee details');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPaymentModeIcon = (mode: string) => {
    switch (mode.toUpperCase()) {
      case 'UPI':
      case 'ONLINE':
        return <CreditCard className="w-4 h-4" />;
      case 'CASH':
        return <IndianRupee className="w-4 h-4" />;
      default:
        return <Receipt className="w-4 h-4" />;
    }
  };

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-yellow-50 to-orange-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/campus')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Fees & Payments</h1>
                <p className="text-xs text-gray-500">Fee details and payment history</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadFees}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : feeProfile ? (
          <>
            {/* Balance Due Alert */}
            {feeProfile.balance_due > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-800">Payment Due</p>
                    <p className="text-sm text-red-600">
                      Outstanding balance: {formatCurrency(feeProfile.balance_due)}
                    </p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  Pay Now
                </button>
              </motion.div>
            )}

            {/* Summary Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">Total Annual Fee</p>
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(feeProfile.total_yearly_fee)}</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">Total Paid</p>
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(feeProfile.total_paid)}</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">Balance Due</p>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    feeProfile.balance_due > 0 ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    <Clock className={`w-5 h-5 ${
                      feeProfile.balance_due > 0 ? 'text-red-600' : 'text-green-600'
                    }`} />
                  </div>
                </div>
                <p className={`text-3xl font-bold ${
                  feeProfile.balance_due > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatCurrency(feeProfile.balance_due)}
                </p>
              </div>
            </motion.div>

            {/* Fee Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Fee Breakdown</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Annual Charges (Admission, Books, etc.)</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(feeProfile.annual_charges)}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Monthly Tuition Fee (x12)</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(feeProfile.monthly_fee)} x 12 = {formatCurrency(feeProfile.monthly_fee * 12)}
                  </span>
                </div>
                {feeProfile.transport_charges > 0 && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Transport Charges (Yearly)</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(feeProfile.transport_charges)}</span>
                  </div>
                )}
                {feeProfile.concession_amount > 0 && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <span className="text-green-600">Concession</span>
                      {feeProfile.concession_reason && (
                        <p className="text-xs text-gray-500">{feeProfile.concession_reason}</p>
                      )}
                    </div>
                    <span className="font-semibold text-green-600">- {formatCurrency(feeProfile.concession_amount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-3 bg-gray-50 rounded-lg px-4">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-gray-900">{formatCurrency(feeProfile.total_yearly_fee)}</span>
                </div>
              </div>
            </motion.div>

            {/* Payment History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
                <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                  <Download className="w-4 h-4" />
                  Download All
                </button>
              </div>

              {payments.length === 0 ? (
                <div className="p-12 text-center">
                  <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No payment records found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Mode
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Receipt
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-gray-900">{formatDate(payment.payment_date)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-600">{payment.payment_for}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-gray-600">
                              {getPaymentModeIcon(payment.payment_mode)}
                              <span>{payment.payment_mode}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-semibold text-green-600">{formatCurrency(payment.amount)}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button className="text-blue-600 hover:text-blue-700 text-sm">
                              {payment.receipt_number || 'View'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No fee information available</p>
          </div>
        )}
      </main>
    </div>
  );
}
