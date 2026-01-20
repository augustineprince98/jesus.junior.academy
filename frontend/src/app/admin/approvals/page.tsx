'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import { approvalApi } from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import { motion } from 'framer-motion';
import {
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface PendingUser {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  created_at: string | null;
}

interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export default function ApprovalsPage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuthStore();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ userId: number; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'ADMIN') {
      router.push('/campus');
      return;
    }

    loadData();
  }, [isAuthenticated, user, router, token]);

  const loadData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const [pendingData, statsData] = await Promise.all([
        approvalApi.getPendingApprovals(token),
        approvalApi.getApprovalStats(token),
      ]);

      // Ensure arrays are always initialized
      setPendingUsers(Array.isArray(pendingData?.pending_users) ? pendingData.pending_users : []);
      setStats(statsData || null);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to load approval data'));
      // Set empty defaults on error
      setPendingUsers([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: number) => {
    if (!token) return;

    try {
      setActionLoading(userId);
      await approvalApi.approveUser(token, userId);
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      setStats(prev => prev ? {
        ...prev,
        pending: prev.pending - 1,
        approved: prev.approved + 1,
      } : null);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to approve user'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!token || !rejectModal) return;

    try {
      setActionLoading(rejectModal.userId);
      await approvalApi.rejectUser(token, rejectModal.userId, rejectReason || undefined);
      setPendingUsers(prev => prev.filter(u => u.id !== rejectModal.userId));
      setStats(prev => prev ? {
        ...prev,
        pending: prev.pending - 1,
        rejected: prev.rejected + 1,
      } : null);
      setRejectModal(null);
      setRejectReason('');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to reject user'));
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'PARENT':
        return 'bg-blue-100 text-blue-700';
      case 'STUDENT':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <AdminLayout activeSection="approvals">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                <p className="text-sm text-gray-600">Approved</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                <p className="text-sm text-gray-600">Rejected</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-700">{stats.total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
              <UserCheck className="w-8 h-8 text-gray-500" />
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Pending Approvals List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
          <button
            onClick={loadData}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No pending approvals</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pendingUsers.map((pendingUser, index) => (
              <motion.div
                key={pendingUser.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-lg">
                        {pendingUser.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{pendingUser.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(pendingUser.role)}`}>
                          {pendingUser.role}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{pendingUser.phone}</span>
                        </div>
                        {pendingUser.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{pendingUser.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Registered: {formatDate(pendingUser.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(pendingUser.id)}
                      disabled={actionLoading === pendingUser.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === pendingUser.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectModal({ userId: pendingUser.id, name: pendingUser.name })}
                      disabled={actionLoading === pendingUser.id}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <UserX className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Registration</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reject <strong>{rejectModal.name}</strong>'s registration?
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRejectModal(null);
                  setRejectReason('');
                }}
                className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectModal.userId}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === rejectModal.userId ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AdminLayout>
  );
}
