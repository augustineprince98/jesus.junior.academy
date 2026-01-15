'use client';

/**
 * Staff Room - Teacher Dashboard
 *
 * Teachers enter here. Inside:
 * - Desk icons (classes)
 * - Attendance sheet visual
 * - Pending work alerts
 * - Leave management
 *
 * Simple. Efficient. No fluff.
 */

import { useState, useEffect } from 'react';
import { useAuthStore, useCampusStore } from '@/store/useStore';
import {
  teacherAttendanceApi,
  teacherLeaveApi,
  attendanceApi,
  homeworkApi,
} from '@/lib/api';
import { formatDate, formatTime, getStatusColor } from '@/lib/utils';
import BuildingPanel, {
  PanelSection,
  PanelCard,
  PanelList,
  PanelLoading,
  PanelEmpty,
} from '@/components/ui/BuildingPanel';
import {
  Clock,
  LogIn,
  LogOut,
  Calendar,
  FileText,
  Users,
  CheckSquare,
  AlertCircle,
  Plus,
} from 'lucide-react';
import type { TeacherAttendance, LeaveApplication } from '@/types';

export default function StaffRoom() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const currentBuilding = useCampusStore((s) => s.currentBuilding);

  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState<TeacherAttendance | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<TeacherAttendance[]>([]);
  const [myLeaves, setMyLeaves] = useState<LeaveApplication[]>([]);
  const [activeTab, setActiveTab] = useState<'attendance' | 'leave'>('attendance');

  useEffect(() => {
    if (currentBuilding === 'staffroom' && token) {
      loadData();
    }
  }, [currentBuilding, token]);

  const loadData = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const [historyRes, leavesRes] = await Promise.all([
        teacherAttendanceApi.getMyHistory(token),
        teacherLeaveApi.getMyLeaves(token),
      ]);

      const history = (historyRes as { records: TeacherAttendance[] }).records || [];
      setAttendanceHistory(history);

      // Find today's attendance
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = history.find((r) => r.date === today);
      setTodayAttendance(todayRecord || null);

      setMyLeaves((leavesRes as { leaves: LeaveApplication[] }).leaves || []);
    } catch (error) {
      console.error('Failed to load staff room data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!token) return;

    try {
      await teacherAttendanceApi.checkIn(token);
      await loadData(); // Refresh
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };

  const handleCheckOut = async () => {
    if (!token) return;

    try {
      await teacherAttendanceApi.checkOut(token);
      await loadData(); // Refresh
    } catch (error) {
      console.error('Check-out failed:', error);
    }
  };

  if (currentBuilding !== 'staffroom') return null;

  // Only teachers can access
  if (user?.role !== 'TEACHER' && user?.role !== 'CLASS_TEACHER' && user?.role !== 'ADMIN') {
    return (
      <BuildingPanel title="Staff Room" subtitle="Restricted Area">
        <PanelEmpty message="This area is for teachers only" />
      </BuildingPanel>
    );
  }

  return (
    <BuildingPanel
      title="Staff Room"
      subtitle={`Welcome, ${user?.name}`}
    >
      {loading ? (
        <PanelLoading />
      ) : (
        <>
          {/* Quick Actions */}
          <PanelSection title="Today's Attendance">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-purple-600 font-medium">
                    {formatDate(new Date())}
                  </p>
                  <p className="text-xs text-purple-500">
                    {todayAttendance?.status || 'Not marked'}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-purple-300" />
              </div>

              {/* Time display */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <p className="text-xs text-purple-500 mb-1">Check In</p>
                  <p className="text-lg font-bold text-purple-700">
                    {todayAttendance?.check_in
                      ? formatTime(todayAttendance.check_in)
                      : '--:--'}
                  </p>
                </div>
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <p className="text-xs text-purple-500 mb-1">Check Out</p>
                  <p className="text-lg font-bold text-purple-700">
                    {todayAttendance?.check_out
                      ? formatTime(todayAttendance.check_out)
                      : '--:--'}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCheckIn}
                  disabled={!!todayAttendance?.check_in}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    todayAttendance?.check_in
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  Check In
                </button>

                <button
                  onClick={handleCheckOut}
                  disabled={!todayAttendance?.check_in || !!todayAttendance?.check_out}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    !todayAttendance?.check_in || todayAttendance?.check_out
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  Check Out
                </button>
              </div>
            </div>
          </PanelSection>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <TabButton
              active={activeTab === 'attendance'}
              onClick={() => setActiveTab('attendance')}
              icon={<Calendar className="w-4 h-4" />}
              label="History"
            />
            <TabButton
              active={activeTab === 'leave'}
              onClick={() => setActiveTab('leave')}
              icon={<FileText className="w-4 h-4" />}
              label="Leave"
              count={myLeaves.filter((l) => l.status === 'PENDING').length}
            />
          </div>

          {activeTab === 'attendance' ? (
            <AttendanceHistory records={attendanceHistory} />
          ) : (
            <LeaveSection leaves={myLeaves} />
          )}
        </>
      )}
    </BuildingPanel>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB BUTTON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
        active
          ? 'bg-primary-500 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className={`px-1.5 py-0.5 text-xs rounded-full ${
            active ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ATTENDANCE HISTORY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function AttendanceHistory({ records }: { records: TeacherAttendance[] }) {
  if (records.length === 0) {
    return <PanelEmpty message="No attendance records" />;
  }

  return (
    <PanelSection title="Recent Attendance">
      <div className="space-y-2">
        {records.slice(0, 10).map((record, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="text-center min-w-[40px]">
                <p className="text-lg font-bold text-gray-700">
                  {new Date(record.date).getDate()}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(record.date).toLocaleDateString('en-IN', { month: 'short' })}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">
                  {formatTime(record.check_in)} - {formatTime(record.check_out)}
                </p>
              </div>
            </div>

            <span className={`badge ${getStatusColor(record.status)}`}>
              {record.status}
            </span>
          </div>
        ))}
      </div>
    </PanelSection>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LEAVE SECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function LeaveSection({ leaves }: { leaves: LeaveApplication[] }) {
  return (
    <PanelSection title="My Leave Applications">
      {leaves.length === 0 ? (
        <PanelEmpty message="No leave applications" />
      ) : (
        <PanelList>
          {leaves.map((leave) => (
            <PanelCard key={leave.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${getStatusColor(leave.status)}`}>
                      {leave.status}
                    </span>
                    <span className="badge bg-blue-100 text-blue-600">
                      {leave.leave_type}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 font-medium">
                    {formatDate(leave.from_date)} - {formatDate(leave.to_date)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {leave.total_days} day{leave.total_days > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">{leave.reason}</p>
                </div>
              </div>

              {leave.review_remarks && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Remarks:</p>
                  <p className="text-sm text-gray-600">{leave.review_remarks}</p>
                </div>
              )}
            </PanelCard>
          ))}
        </PanelList>
      )}
    </PanelSection>
  );
}
