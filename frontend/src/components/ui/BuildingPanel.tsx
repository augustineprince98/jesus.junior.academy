'use client';

/**
 * Building Panel - Container for building content
 *
 * When a user enters a building, this panel slides up
 * showing the relevant content for that building.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft } from 'lucide-react';
import { useCampusStore } from '@/store/useStore';
import type { BuildingType } from '@/types';

interface BuildingPanelProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const buildingInfo: Record<BuildingType, { icon: string; color: string }> = {
  entrance: { icon: '🚪', color: 'bg-blue-500' },
  classroom: { icon: '📚', color: 'bg-green-500' },
  library: { icon: '📖', color: 'bg-amber-500' },
  accounts: { icon: '💰', color: 'bg-emerald-500' },
  noticeboard: { icon: '📋', color: 'bg-orange-500' },
  staffroom: { icon: '👨‍🏫', color: 'bg-purple-500' },
  adminblock: { icon: '🏛️', color: 'bg-red-500' },
};

export default function BuildingPanel({ children, title, subtitle }: BuildingPanelProps) {
  const currentBuilding = useCampusStore((s) => s.currentBuilding);
  const exitBuilding = useCampusStore((s) => s.exitBuilding);
  const isTransitioning = useCampusStore((s) => s.isTransitioning);

  if (!currentBuilding) return null;

  const info = buildingInfo[currentBuilding];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 md:bottom-4 md:left-4 md:right-auto md:w-[480px] z-20"
      >
        <div className="panel max-h-[80vh] md:max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="panel-header flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={exitBuilding}
                disabled={isTransitioning}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Exit building"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>

              <div className={`w-10 h-10 ${info.color} rounded-xl flex items-center justify-center text-xl`}>
                {info.icon}
              </div>

              <div>
                <h2 className="panel-title">{title}</h2>
                {subtitle && (
                  <p className="text-sm text-gray-500">{subtitle}</p>
                )}
              </div>
            </div>

            <button
              onClick={exitBuilding}
              disabled={isTransitioning}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors md:hidden"
              aria-label="Close panel"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="panel-content flex-1 overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUB-COMPONENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function PanelSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6 last:mb-0">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function PanelCard({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`card ${onClick ? 'cursor-pointer hover:shadow-lg' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function PanelList({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3">{children}</div>;
}

export function PanelEmpty({ message }: { message: string }) {
  return (
    <div className="py-12 text-center">
      <p className="text-gray-400">{message}</p>
    </div>
  );
}

export function PanelLoading() {
  return (
    <div className="py-12 flex justify-center">
      <div className="loading-spinner" />
    </div>
  );
}
