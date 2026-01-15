/**
 * Core types for Jesus Junior Academy Campus
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// USER & AUTH
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type UserRole = 'ADMIN' | 'CLASS_TEACHER' | 'TEACHER' | 'PARENT' | 'STUDENT';

export interface User {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  role: UserRole;
  is_active: boolean;
  student_id: number | null;
  parent_id: number | null;
  teacher_id: number | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CAMPUS NAVIGATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type BuildingType =
  | 'entrance'
  | 'classroom'
  | 'library'
  | 'accounts'
  | 'noticeboard'
  | 'staffroom'
  | 'adminblock';

export interface Building {
  id: BuildingType;
  name: string;
  description: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  allowedRoles: UserRole[];
  icon: string;
}

export interface CampusState {
  currentBuilding: BuildingType | null;
  isTransitioning: boolean;
  selectedClass: number | null;
  cameraPosition: [number, number, number];
  lookAt: [number, number, number];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RESULTS & MARKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface SubjectMark {
  subject_id: number;
  subject_name: string;
  marks_obtained: number;
  max_marks: number;
  percentage: number;
}

export interface ExamResult {
  exam_id: number;
  exam_name: string;
  exam_type: 'FA' | 'TERM';
  subjects: SubjectMark[];
  total_obtained: number;
  total_max: number;
  percentage: number;
}

export interface StudentResult {
  student_id: number;
  student_name: string;
  class_name: string;
  academic_year: string;
  fa_score: number;      // Out of 200 (20% weightage)
  term_score: number;    // Out of 800 (80% weightage)
  final_score: number;   // Out of 1000
  percentage: number;
  grade: string;
  class_rank: number | null;
  is_passed: boolean;
  exams: ExamResult[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FEES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface FeeInstallment {
  installment_number: number;
  amount: number;
  due_date: string;
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
  paid_amount: number;
  payment_date: string | null;
}

export interface FeeProfile {
  student_id: number;
  student_name: string;
  class_name: string;
  total_fee: number;
  total_paid: number;
  total_pending: number;
  discount_amount: number;
  installments: FeeInstallment[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ATTENDANCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface AttendanceRecord {
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
  remarks: string | null;
}

export interface AttendanceSummary {
  total_days: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NOTIFICATIONS & ANNOUNCEMENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'HOLIDAY' | 'HOMEWORK' | 'ANNOUNCEMENT' | 'FEE_REMINDER' | 'RESULT';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  is_read: boolean;
  created_at: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EVENTS & ACHIEVEMENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface SchoolEvent {
  id: number;
  title: string;
  description: string;
  event_type: 'CELEBRATION' | 'SPORTS' | 'CULTURAL' | 'ACADEMIC' | 'HOLIDAY' | 'MEETING';
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  image_url: string | null;
  is_featured: boolean;
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  category: 'ACADEMIC' | 'SPORTS' | 'ARTS' | 'SCIENCE' | 'LEADERSHIP' | 'COMMUNITY';
  achievement_date: string;
  image_url: string | null;
  student_name: string | null;
  is_featured: boolean;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOMEWORK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface Homework {
  id: number;
  title: string;
  description: string;
  subject_name: string;
  assigned_date: string;
  due_date: string;
  assigned_by: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEACHER SPECIFIC
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface TeacherAttendance {
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE';
}

export interface LeaveApplication {
  id: number;
  leave_type: 'CASUAL' | 'SICK' | 'EARNED' | 'MATERNITY' | 'EMERGENCY';
  from_date: string;
  to_date: string;
  total_days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  applied_at: string;
  review_remarks: string | null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CLASSES & SUBJECTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface SchoolClass {
  id: number;
  name: string;
  section: string | null;
  display_name: string;
  class_teacher_name: string | null;
  student_count: number;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
}
