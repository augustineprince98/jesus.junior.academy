/**
 * API Client for Jesus Junior Academy Backend
 *
 * Clean, type-safe API calls with automatic token management
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface ApiOptions {
  method?: HttpMethod;
  body?: Record<string, unknown>;
  token?: string | null;
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string
  ) {
    super(detail);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token, params } = options;

  // Build URL with query params
  const url = new URL(`${API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  // Build headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Make request
  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle errors
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new ApiError(response.status, error.detail || 'Request failed');
  }

  return response.json();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUTH API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface LoginUser {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  student_id: number | null;
  parent_id: number | null;
  teacher_id: number | null;
}

export const authApi = {
  login: (phone: string, password: string) =>
    request<{ access_token: string; token_type: string; user: LoginUser }>('/auth/login', {
      method: 'POST',
      body: { phone, password },
    }),

  requestPasswordReset: (phone: string) =>
    request<{ message: string }>('/auth/password-reset/request', {
      method: 'POST',
      body: { phone },
    }),

  verifyPasswordReset: (phone: string, otp: string, newPassword: string) =>
    request<{ message: string }>('/auth/password-reset/verify', {
      method: 'POST',
      body: { phone, otp, new_password: newPassword },
    }),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RESULTS API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const resultsApi = {
  getMyMarks: (token: string) =>
    request<{ student_id: number; marks: unknown[] }>('/results/my-marks', { token }),

  getMyResult: (token: string, academicYearId?: number) =>
    request('/results/my-result', { token, params: { academic_year_id: academicYearId } }),

  getClassResults: (token: string, classId: number, academicYearId: number) =>
    request(`/results/class/${classId}`, { token, params: { academic_year_id: academicYearId } }),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FEES API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const feesApi = {
  getMyFees: (token: string) =>
    request('/fees/my-fees', { token }),

  getChildFees: (token: string, studentId: number) =>
    request(`/fees/student/${studentId}`, { token }),

  getPaymentHistory: (token: string, studentId: number) =>
    request(`/fees/payments/${studentId}`, { token }),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ATTENDANCE API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const attendanceApi = {
  getMyAttendance: (token: string, month?: number, year?: number) =>
    request('/attendance/my-history', { token, params: { month, year } }),

  getStudentAttendance: (token: string, studentId: number, month?: number, year?: number) =>
    request(`/attendance/student/${studentId}`, { token, params: { month, year } }),

  getClassAttendance: (token: string, classId: number, date: string) =>
    request(`/attendance/class/${classId}`, { token, params: { date } }),

  markBulkAttendance: (
    token: string,
    classId: number,
    academicYearId: number,
    date: string,
    records: Array<{ student_id: number; status: string; remarks?: string }>
  ) =>
    request('/attendance/bulk', {
      method: 'POST',
      token,
      body: { class_id: classId, academic_year_id: academicYearId, date, records },
    }),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NOTIFICATIONS API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const notificationsApi = {
  getMy: (token: string, unreadOnly = false) =>
    request('/notifications/my', { token, params: { unread_only: unreadOnly } }),

  markRead: (token: string, notificationId: number) =>
    request(`/notifications/${notificationId}/read`, { method: 'POST', token }),

  markAllRead: (token: string) =>
    request('/notifications/read-all', { method: 'POST', token }),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOMEWORK API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const homeworkApi = {
  getForStudent: (token: string, studentId: number, pendingOnly = true) =>
    request('/homework/student', { token, params: { student_id: studentId, pending_only: pendingOnly } }),

  getForClass: (token: string, classId: number) =>
    request(`/homework/class/${classId}`, { token }),

  create: (
    token: string,
    data: {
      class_id: number;
      subject_id: number;
      title: string;
      description: string;
      due_date: string;
    }
  ) =>
    request('/homework/create', { method: 'POST', token, body: data }),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EVENTS API (PUBLIC)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const eventsApi = {
  getPublic: (eventType?: string, upcomingOnly = true, limit = 20) =>
    request('/events/public', { params: { event_type: eventType, upcoming_only: upcomingOnly, limit } }),

  getUpcoming: (token: string, days = 30) =>
    request('/events/upcoming', { token, params: { days } }),

  getById: (eventId: number) =>
    request(`/events/${eventId}`),

  // Admin endpoints
  list: (token: string, eventType?: string, limit = 100, offset = 0) =>
    request('/events/list', { token, params: { event_type: eventType, limit, offset } }),

  create: (token: string, data: {
    title: string;
    description: string;
    event_type: string;
    event_date: string;
    start_time?: string;
    end_time?: string;
    venue?: string;
    image_url?: string;
    is_public?: boolean;
    is_featured?: boolean;
    for_students?: boolean;
    for_parents?: boolean;
    for_teachers?: boolean;
  }) =>
    request('/events/create', { method: 'POST', token, body: data }),

  update: (token: string, id: number, data: {
    title?: string;
    description?: string;
    event_type?: string;
    event_date?: string;
    start_time?: string;
    end_time?: string;
    venue?: string;
    image_url?: string;
    is_public?: boolean;
    is_featured?: boolean;
  }) =>
    request(`/events/${id}`, { method: 'PUT', token, body: data }),

  delete: (token: string, id: number) =>
    request(`/events/${id}`, { method: 'DELETE', token }),

  getTypes: () =>
    request('/events/types'),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ADMISSIONS API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const admissionsApi = {
  // Public enquiry submission
  submitEnquiry: (data: {
    child_name: string;
    parent_name: string;
    contact_number: string;
    seeking_class: string;
  }) =>
    request('/admissions/enquiry', { method: 'POST', body: data }),

  // Admin endpoints
  list: (token: string, status?: string, limit = 100, offset = 0) =>
    request('/admissions/list', { token, params: { status, limit, offset } }),

  updateStatus: (token: string, id: number, status: string) =>
    request(`/admissions/${id}/status`, { method: 'PUT', token, body: { status } }),

  delete: (token: string, id: number) =>
    request(`/admissions/${id}`, { method: 'DELETE', token }),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ACHIEVEMENTS API (PUBLIC)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const achievementsApi = {
  getPublic: (category?: string, featuredOnly = false, limit = 20) =>
    request('/achievements/public', { params: { category, featured_only: featuredOnly, limit } }),

  // Admin endpoints
  list: (token: string, category?: string, limit = 100, offset = 0) =>
    request('/achievements/list', { token, params: { category, limit, offset } }),

  create: (token: string, data: {
    student_id?: number;
    title: string;
    description: string;
    category: string;
    achievement_date: string;
    image_url?: string;
    is_featured?: boolean;
    is_public?: boolean;
  }) =>
    request('/achievements/create', { method: 'POST', token, body: data }),

  update: (token: string, id: number, data: {
    title?: string;
    description?: string;
    category?: string;
    image_url?: string;
    is_featured?: boolean;
    is_public?: boolean;
    display_order?: number;
  }) =>
    request(`/achievements/${id}`, { method: 'PUT', token, body: data }),

  delete: (token: string, id: number) =>
    request(`/achievements/${id}`, { method: 'DELETE', token }),

  getCategories: () =>
    request('/achievements/categories'),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEACHER ATTENDANCE API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const teacherAttendanceApi = {
  checkIn: (token: string, remarks?: string) =>
    request('/teacher-attendance/check-in', { method: 'POST', token, body: { remarks } }),

  checkOut: (token: string, remarks?: string) =>
    request('/teacher-attendance/check-out', { method: 'POST', token, body: { remarks } }),

  getMyHistory: (token: string, month?: number, year?: number) =>
    request('/teacher-attendance/my-history', { token, params: { month, year } }),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEACHER LEAVE API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const teacherLeaveApi = {
  apply: (
    token: string,
    data: { leave_type: string; from_date: string; to_date: string; reason: string }
  ) =>
    request('/teacher-leave/apply', { method: 'POST', token, body: data }),

  getMyLeaves: (token: string, status?: string) =>
    request('/teacher-leave/my-leaves', { token, params: { status } }),

  cancel: (token: string, leaveId: number) =>
    request(`/teacher-leave/${leaveId}/cancel`, { method: 'DELETE', token }),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ADMIN APIS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REGISTRATION API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const registrationApi = {
  register: (data: {
    name: string;
    phone: string;
    password: string;
    email?: string;
    role: string;
  }) =>
    request<{ status: string; message: string; user_id: number }>('/register/', {
      method: 'POST',
      body: data,
    }),

  checkStatus: (phone: string) =>
    request<{ phone: string; status: string; message: string }>(`/register/status/${phone}`),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ADMIN APIS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// USER APPROVAL API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const approvalApi = {
  getPendingApprovals: (token: string, limit = 50, offset = 0) =>
    request<{ pending_users: any[]; count: number; total: number }>(
      '/users/pending-approvals',
      { token, params: { limit, offset } }
    ),

  approveUser: (token: string, userId: number) =>
    request<{ status: string; user_id: number; message: string }>(
      `/users/${userId}/approve`,
      { method: 'POST', token }
    ),

  rejectUser: (token: string, userId: number, reason?: string) =>
    request<{ status: string; user_id: number; message: string; reason?: string }>(
      `/users/${userId}/reject`,
      { method: 'POST', token, body: { reason } }
    ),

  getApprovalStats: (token: string) =>
    request<{ pending: number; approved: number; rejected: number; total: number }>(
      '/users/approval-stats',
      { token }
    ),
};

export const adminApi = {
  // User management
  createUser: (
    token: string,
    data: {
      name: string;
      phone: string;
      password: string;
      role: string;
      email?: string;
      student_id?: number;
      parent_id?: number;
      teacher_id?: number;
    }
  ) =>
    request('/users/create', { method: 'POST', token, body: data }),

  listUsers: (token: string, role?: string, isActive?: boolean) =>
    request('/users/', { token, params: { role, is_active: isActive } }),

  assignClassTeacher: (token: string, userId: number, classId: number) =>
    request(`/users/${userId}/assign-class-teacher`, {
      method: 'POST',
      token,
      body: { class_id: classId },
    }),

  // Leave management
  getPendingLeaves: (token: string) =>
    request('/teacher-leave/pending', { token }),

  approveLeave: (token: string, leaveId: number, remarks?: string) =>
    request(`/teacher-leave/${leaveId}/approve`, {
      method: 'POST',
      token,
      body: { remarks },
    }),

  rejectLeave: (token: string, leaveId: number, remarks?: string) =>
    request(`/teacher-leave/${leaveId}/reject`, {
      method: 'POST',
      token,
      body: { remarks },
    }),

  // Promotion
  bulkPromote: (token: string, academicYearId: number, newAcademicYearId: number) =>
    request('/promotion/bulk-promote-all', {
      method: 'POST',
      token,
      body: { current_academic_year_id: academicYearId, new_academic_year_id: newAcademicYearId },
    }),
};

export { ApiError };
