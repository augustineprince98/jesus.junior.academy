/**
 * Global State Management with Zustand
 *
 * Clean, type-safe state management for:
 * - Authentication
 * - Campus navigation
 * - UI state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole, BuildingType } from '@/types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUTH STORE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: undefined, token: undefined) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: 'jja-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CAMPUS NAVIGATION STORE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type CameraTarget = {
  position: [number, number, number];
  lookAt: [number, number, number];
};

interface CampusState {
  // Current location
  currentBuilding: BuildingType | null;
  isTransitioning: boolean;

  // Camera state
  cameraTarget: CameraTarget;

  // Selection state
  selectedClassId: number | null;
  selectedStudentId: number | null;

  // Actions
  enterBuilding: (building: BuildingType) => void;
  exitBuilding: () => void;
  setCameraTarget: (target: CameraTarget) => void;
  selectClass: (classId: number | null) => void;
  selectStudent: (studentId: number | null) => void;
  setTransitioning: (value: boolean) => void;
}

// Default camera position - overlooking the campus
const DEFAULT_CAMERA: CameraTarget = {
  position: [0, 15, 25],
  lookAt: [0, 0, 0],
};

// Building camera positions
const BUILDING_CAMERAS: Record<BuildingType, CameraTarget> = {
  entrance: {
    position: [0, 3, 10],
    lookAt: [0, 2, 0],
  },
  classroom: {
    position: [-8, 5, 8],
    lookAt: [-10, 3, 0],
  },
  library: {
    position: [8, 5, 8],
    lookAt: [10, 3, 0],
  },
  accounts: {
    position: [10, 4, -5],
    lookAt: [12, 2, -8],
  },
  noticeboard: {
    position: [0, 2, 5],
    lookAt: [0, 3, 0],
  },
  staffroom: {
    position: [-10, 4, -5],
    lookAt: [-12, 2, -8],
  },
  adminblock: {
    position: [0, 6, -12],
    lookAt: [0, 4, -15],
  },
};

export const useCampusStore = create<CampusState>()((set) => ({
  currentBuilding: null,
  isTransitioning: false,
  cameraTarget: DEFAULT_CAMERA,
  selectedClassId: null,
  selectedStudentId: null,

  enterBuilding: (building) =>
    set({
      currentBuilding: building,
      isTransitioning: true,
      cameraTarget: BUILDING_CAMERAS[building],
    }),

  exitBuilding: () =>
    set({
      currentBuilding: null,
      isTransitioning: true,
      cameraTarget: DEFAULT_CAMERA,
      selectedClassId: null,
      selectedStudentId: null,
    }),

  setCameraTarget: (target) =>
    set({ cameraTarget: target }),

  selectClass: (classId) =>
    set({ selectedClassId: classId }),

  selectStudent: (studentId) =>
    set({ selectedStudentId: studentId }),

  setTransitioning: (value) =>
    set({ isTransitioning: value }),
}));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UI STORE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface UIState {
  // Loading states
  isLoading: boolean;
  loadingMessage: string | null;

  // Modal states
  activeModal: string | null;
  modalData: Record<string, unknown> | null;

  // Notifications
  unreadCount: number;

  // Actions
  setLoading: (loading: boolean, message?: string) => void;
  openModal: (modalId: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  setUnreadCount: (count: number) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isLoading: false,
  loadingMessage: null,
  activeModal: null,
  modalData: null,
  unreadCount: 0,

  setLoading: (loading, message = null) =>
    set({
      isLoading: loading,
      loadingMessage: message,
    }),

  openModal: (modalId, data = null) =>
    set({
      activeModal: modalId,
      modalData: data,
    }),

  closeModal: () =>
    set({
      activeModal: null,
      modalData: null,
    }),

  setUnreadCount: (count) =>
    set({ unreadCount: count }),
}));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILITY HOOKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Check if user has permission to access a building
 */
export function canAccessBuilding(role: UserRole | undefined, building: BuildingType): boolean {
  if (!role) return false;

  const permissions: Record<BuildingType, UserRole[]> = {
    entrance: ['ADMIN', 'CLASS_TEACHER', 'TEACHER', 'PARENT', 'STUDENT'],
    classroom: ['ADMIN', 'CLASS_TEACHER', 'TEACHER', 'PARENT', 'STUDENT'],
    library: ['ADMIN', 'CLASS_TEACHER', 'TEACHER', 'PARENT', 'STUDENT'],
    accounts: ['ADMIN', 'CLASS_TEACHER', 'PARENT'],
    noticeboard: ['ADMIN', 'CLASS_TEACHER', 'TEACHER', 'PARENT', 'STUDENT'],
    staffroom: ['ADMIN', 'CLASS_TEACHER', 'TEACHER'],
    adminblock: ['ADMIN'],
  };

  return permissions[building]?.includes(role) ?? false;
}
