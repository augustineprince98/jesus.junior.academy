'use client';

/**
 * Admin Block - The Control Tower
 *
 * Only visible to Admin role.
 * Contains:
 * - Academic year setup
 * - Class promotion
 * - Fee locking
 * - Result approval
 * - Reports export
 * - User management
 * - Leave approvals
 *
 * This is AUTHORITY. OVERSIGHT. CONFIDENCE.
 */

import { useState, useEffect } from 'react';
import { useAuthStore, useCampusStore } from '@/store/useStore';
import { adminApi } from '@/lib/api';
import { formatDate, getStatusColor } from '@/lib/utils';
import BuildingPanel, {
  PanelSection,
  PanelCard,
  PanelList,
  PanelLoading,
  PanelEmpty,
} from '@/components/ui/BuildingPanel';
import {
  Settings,
  Users,
  Calendar,
  FileCheck,
  DollarSign,
  GraduationCap,
  ClipboardList,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import type { LeaveApplication } from '@/types';

interface PendingLeave extends LeaveApplication {
  teacher_id: number;
}

export default function AdminBlock() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const currentBuilding = useCampusStore((s) => s.currentBuilding);

  const [loading, setLoading] = useState(true);
  const [pendingLeaves, setPendingLeaves] = useState<PendingLeave[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    if (currentBuilding === 'adminblock' && token) {
      loadData();
    }
  }, [currentBuilding, token]);

  const loadData = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const leavesRes = await adminApi.getPendingLeaves(token);
      setPendingLeaves((leavesRes as { pending_leaves: PendingLeave[] }).pending_leaves || []);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (leaveId: number) => {
    if (!token) return;

    try {
      await adminApi.approveLeave(token, leaveId);
      await loadData(); // Refresh
    } catch (error) {
      console.error('Failed to approve leave:', error);
    }
  };

  const handleRejectLeave = async (leaveId: number) => {
    if (!token) return;

    try {
      await adminApi.rejectLeave(token, leaveId);
      await loadData(); // Refresh
    } catch (error) {
      console.error('Failed to reject leave:', error);
    }
  };

  if (currentBuilding !== 'adminblock') return null;

  // Only admin can access
  if (user?.role !== 'ADMIN') {
    return (
      <BuildingPanel title="Admin Block" subtitle="Restricted Area">
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">This area is for administrators only</p>
        </div>
      </BuildingPanel>
    );
  }

  return (
    <BuildingPanel
      title="Admin Block"
      subtitle="Control Center"
    >
      {loading ? (
        <PanelLoading />
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <QuickStatCard
              icon={<ClipboardList className="w-5 h-5" />}
              label="Pending Leaves"
              value={pendingLeaves.length}
              color="bg-orange-100 text-orange-600"
            />
            <QuickStatCard
              icon={<Users className="w-5 h-5" />}
              label="User Management"
              value="Open"
              color="bg-blue-100 text-blue-600"
              onClick={() => setActiveSection('users')}
            />
          </div>

          {/* Control Panel Menu */}
          <PanelSection title="Control Panel">
            <div className="space-y-2">
              <ControlItem
                icon={<Calendar className="w-5 h-5" />}
                title="Academic Year"
                description="Manage academic years and sessions"
                onClick={() => setActiveSection('academic')}
              />
              <ControlItem
                icon={<GraduationCap className="w-5 h-5" />}
                title="Promotions"
                description="Bulk promote students to next class"
                onClick={() => setActiveSection('promotion')}
              />
              <ControlItem
                icon={<DollarSign className="w-5 h-5" />}
                title="Fee Structure"
                description="Configure fees and installments"
                onClick={() => setActiveSection('fees')}
              />
              <ControlItem
                icon={<FileCheck className="w-5 h-5" />}
                title="Result Publication"
                description="Approve and publish results"
                onClick={() => setActiveSection('results')}
              />
              <ControlItem
                icon={<Users className="w-5 h-5" />}
                title="User Management"
                description="Create and manage user accounts"
                onClick={() => setActiveSection('users')}
              />
            </div>
          </PanelSection>

          {/* Pending Approvals */}
          {pendingLeaves.length > 0 && (
            <PanelSection title="Pending Leave Approvals">
              <PanelList>
                {pendingLeaves.map((leave) => (
                  <LeaveApprovalCard
                    key={leave.id}
                    leave={leave}
                    onApprove={() => handleApproveLeave(leave.id)}
                    onReject={() => handleRejectLeave(leave.id)}
                  />
                ))}
              </PanelList>
            </PanelSection>
          )}
        </>
      )}
    </BuildingPanel>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QUICK STAT CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function QuickStatCard({
  icon,
  label,
  value,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl ${color} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
    >
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-80">{label}</p>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONTROL ITEM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ControlItem({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
    >
      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </button>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LEAVE APPROVAL CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function LeaveApprovalCard({
  leave,
  onApprove,
  onReject,
}: {
  leave: PendingLeave;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <PanelCard>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge bg-yellow-100 text-yellow-700">PENDING</span>
            <span className="badge bg-blue-100 text-blue-600">{leave.leave_type}</span>
          </div>
          <p className="text-sm text-gray-500">Teacher ID: {leave.teacher_id}</p>
        </div>
        <AlertTriangle className="w-5 h-5 text-yellow-500" />
      </div>

      <div className="mb-3">
        <p className="text-sm font-medium text-gray-900">
          {formatDate(leave.from_date)} - {formatDate(leave.to_date)}
        </p>
        <p className="text-xs text-gray-500">
          {leave.total_days} day{leave.total_days > 1 ? 's' : ''}
        </p>
        <p className="text-sm text-gray-600 mt-2">{leave.reason}</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onApprove}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          Approve
        </button>
        <button
          onClick={onReject}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          <XCircle className="w-4 h-4" />
          Reject
        </button>
      </div>
    </PanelCard>
  );
}
