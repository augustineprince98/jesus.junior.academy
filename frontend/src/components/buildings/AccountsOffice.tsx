'use client';

/**
 * Accounts Office - Fees Engine
 *
 * A small admin-style office where parents see:
 * - Fee breakdown
 * - Installments
 * - Paid/Pending status
 * - Payment history
 *
 * This makes fees feel TRANSPARENT, not threatening.
 */

import { useState, useEffect } from 'react';
import { useAuthStore, useCampusStore } from '@/store/useStore';
import { feesApi } from '@/lib/api';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import BuildingPanel, {
  PanelSection,
  PanelCard,
  PanelList,
  PanelLoading,
  PanelEmpty,
} from '@/components/ui/BuildingPanel';
import {
  Receipt,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  IndianRupee,
} from 'lucide-react';

interface FeeInstallment {
  installment_number: number;
  amount: number;
  due_date: string;
  status: string;
  paid_amount: number;
  payment_date: string | null;
}

interface FeeProfile {
  student_name: string;
  class_name: string;
  total_fee: number;
  total_paid: number;
  total_pending: number;
  discount_amount: number;
  installments: FeeInstallment[];
}

export default function AccountsOffice() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const currentBuilding = useCampusStore((s) => s.currentBuilding);

  const [loading, setLoading] = useState(true);
  const [feeProfile, setFeeProfile] = useState<FeeProfile | null>(null);

  useEffect(() => {
    if (currentBuilding === 'accounts' && token) {
      loadFees();
    }
  }, [currentBuilding, token]);

  const loadFees = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await feesApi.getMyFees(token);
      setFeeProfile(response as FeeProfile);
    } catch (error) {
      console.error('Failed to load fees:', error);
    } finally {
      setLoading(false);
    }
  };

  if (currentBuilding !== 'accounts') return null;

  return (
    <BuildingPanel
      title="Accounts Office"
      subtitle="Fee Details & Payments"
    >
      {loading ? (
        <PanelLoading />
      ) : !feeProfile ? (
        <PanelEmpty message="No fee profile found" />
      ) : (
        <>
          {/* Fee Summary */}
          <PanelSection title="Fee Overview">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-emerald-600 font-medium">
                    {feeProfile.student_name}
                  </p>
                  <p className="text-xs text-emerald-500">{feeProfile.class_name}</p>
                </div>
                <div className="p-2 bg-emerald-200/50 rounded-lg">
                  <IndianRupee className="w-5 h-5 text-emerald-700" />
                </div>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <SummaryCard
                  label="Total Fee"
                  value={feeProfile.total_fee}
                  color="text-gray-700"
                />
                <SummaryCard
                  label="Paid"
                  value={feeProfile.total_paid}
                  color="text-emerald-700"
                />
                <SummaryCard
                  label="Pending"
                  value={feeProfile.total_pending}
                  color="text-orange-600"
                />
              </div>

              {/* Discount badge */}
              {feeProfile.discount_amount > 0 && (
                <div className="mt-4 pt-3 border-t border-emerald-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-emerald-600">Discount Applied</span>
                    <span className="font-semibold text-emerald-700">
                      - {formatCurrency(feeProfile.discount_amount)}
                    </span>
                  </div>
                </div>
              )}

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-emerald-600 mb-1">
                  <span>Payment Progress</span>
                  <span>
                    {((feeProfile.total_paid / feeProfile.total_fee) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-emerald-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${(feeProfile.total_paid / feeProfile.total_fee) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </PanelSection>

          {/* Installments */}
          <PanelSection title="Payment Schedule">
            <PanelList>
              {feeProfile.installments.length === 0 ? (
                <PanelEmpty message="No installments scheduled" />
              ) : (
                feeProfile.installments.map((inst) => (
                  <InstallmentCard key={inst.installment_number} installment={inst} />
                ))
              )}
            </PanelList>
          </PanelSection>
        </>
      )}
    </BuildingPanel>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUMMARY CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white/60 rounded-lg p-3 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`font-bold ${color}`}>{formatCurrency(value)}</p>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INSTALLMENT CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function InstallmentCard({ installment }: { installment: FeeInstallment }) {
  const isPaid = installment.status === 'PAID';
  const isOverdue = installment.status === 'OVERDUE';
  const isPartial = installment.status === 'PARTIAL';

  const StatusIcon = isPaid
    ? CheckCircle
    : isOverdue
    ? AlertCircle
    : Clock;

  return (
    <PanelCard>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isPaid
                ? 'bg-green-100 text-green-600'
                : isOverdue
                ? 'bg-red-100 text-red-600'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <StatusIcon className="w-5 h-5" />
          </div>

          <div>
            <p className="font-medium text-gray-900">
              Installment {installment.installment_number}
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Due: {formatDate(installment.due_date)}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="font-bold text-gray-900">
            {formatCurrency(installment.amount)}
          </p>
          <span className={`badge ${getStatusColor(installment.status)}`}>
            {installment.status}
          </span>
        </div>
      </div>

      {/* Payment details if partial/paid */}
      {(isPaid || isPartial) && installment.payment_date && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
          <span className="text-gray-500">Paid Amount</span>
          <span className="font-medium text-green-600">
            {formatCurrency(installment.paid_amount)}
          </span>
        </div>
      )}

      {isPartial && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Remaining</span>
          <span className="font-medium text-orange-600">
            {formatCurrency(installment.amount - installment.paid_amount)}
          </span>
        </div>
      )}
    </PanelCard>
  );
}
