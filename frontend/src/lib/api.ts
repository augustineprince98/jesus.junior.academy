/**
 * API Client for Jesus Junior Academy Backend
 *
 * Clean, type-safe API calls with automatic token management
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://jja-backend.onrender.com';

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
    credentials: 'include',
  });

  // Handle errors
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));

    let errorMessage = 'Request failed';
    if (error.detail) {
      if (Array.isArray(error.detail)) {
        // FastAPI validation errors (422) - detail is array of objects
        errorMessage = error.detail.map((e: any) => {
          if (typeof e === 'string') return e;
          if (e.msg) return `${e.loc?.join('.') || ''}: ${e.msg}`;
          return JSON.stringify(e);
        }).join(', ');
      } else if (typeof error.detail === 'string') {
        errorMessage = error.detail;
      } else if (typeof error.detail === 'object') {
        errorMessage = error.detail.message || error.detail.error || JSON.stringify(error.detail);
      }
    } else if (error.message) {
      // Custom exception handler format: { message: "...", errors: [...] }
      errorMessage = error.message;
      if (error.errors && Array.isArray(error.errors)) {
        const fieldErrors = error.errors.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
        if (fieldErrors) errorMessage = fieldErrors;
      }
    }

    throw new ApiError(response.status, errorMessage);
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

  getMe: (token: string) =>
    request<LoginUser>('/auth/me', { token }),
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

  getForClass: (token: string, classId: number, academicYearId: number, subjectId?: number) =>
    request(`/homework/class/${classId}/year/${academicYearId}`, {
      token,
      params: { subject_id: subjectId }
    }),

  create: (
    token: string,
    data: {
      class_id: number;
      subject_id: number;
      academic_year_id: number;
      title: string;
      description: string;
      assigned_date: string;
      due_date: string;
    }
  ) =>
    request<{ status: string; homework_id: number; title: string; is_published: boolean }>(
      '/homework/create',
      { method: 'POST', token, body: data }
    ),

  publish: (token: string, homeworkId: number, sendNotification = false) =>
    request(`/homework/${homeworkId}/publish`, {
      method: 'POST',
      token,
      body: { send_individual_notification: sendNotification },
    }),

  update: (token: string, homeworkId: number, data: {
    title?: string;
    description?: string;
    due_date?: string;
  }) =>
    request(`/homework/${homeworkId}`, { method: 'PUT', token, body: data }),

  delete: (token: string, homeworkId: number) =>
    request(`/homework/${homeworkId}`, { method: 'DELETE', token }),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EVENTS API (PUBLIC)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const eventsApi = {
  getPublic: (eventType?: string, upcomingOnly = true, limit = 20, featuredOnly = false) =>
    request('/events/public', { params: { event_type: eventType, upcoming_only: upcomingOnly, limit, featured_only: featuredOnly } }),

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
// USERS API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const usersApi = {
  getUsers: (token: string, role?: string, isActive?: boolean) =>
    request('/users/', { token, params: { role, is_active: isActive } }),

  getUser: (token: string, userId: number) =>
    request(`/users/${userId}`, { token }),

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

  updateRole: (token: string, userId: number, data: { new_role: string; teacher_id?: number }) =>
    request(`/users/${userId}/role`, { method: 'PUT', token, body: data }),

  assignClassTeacher: (token: string, userId: number, classId: number) =>
    request(`/users/${userId}/assign-class-teacher`, {
      method: 'POST',
      token,
      body: { class_id: classId },
    }),

  linkEntity: (
    token: string,
    userId: number,
    data: { student_id?: number; parent_id?: number; teacher_id?: number }
  ) =>
    request(`/users/${userId}/link`, { method: 'POST', token, body: data }),

  deactivateUser: (token: string, userId: number) =>
    request(`/users/${userId}`, { method: 'DELETE', token }),

  getRoles: () =>
    request('/users/roles/list'),

  // Approval management
  getPendingApprovals: (token: string, limit = 50, offset = 0) =>
    request('/users/pending-approvals', { token, params: { limit, offset } }),

  approveUser: (token: string, userId: number) =>
    request(`/users/${userId}/approve`, { method: 'POST', token }),

  rejectUser: (token: string, userId: number, reason?: string) =>
    request(`/users/${userId}/reject`, { method: 'POST', token, body: { reason } }),

  getApprovalStats: (token: string) =>
    request('/users/approval-stats', { token }),

  getDashboardStats: (token: string) =>
    request<{
      totalUsers: number;
      pendingAdmissions: number;
      totalAchievements: number;
      upcomingEvents: number;
      byRole: { students: number; parents: number; teachers: number };
    }>('/users/dashboard-stats', { token }),
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
    class_id?: number;
    dob?: string;
    gender?: string;
    father_name?: string;  // Required for students
    mother_name?: string;  // Required for students
  }) =>
    request<{ status: string; message: string; user_id: number }>('/register/', {
      method: 'POST',
      body: data,
    }),

  checkStatus: (phone: string) =>
    request<{ phone: string; status: string; message: string }>(`/register/status/${phone}`),

  // Get classes for registration dropdown (public endpoint)
  getClasses: () =>
    request<{
      classes: { id: number; name: string }[];
      academic_year: { id: number; name: string } | null;
    }>('/enrollment/classes'),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ENROLLMENT API (Admin)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const enrollmentApi = {
  // Assign user to class (creates Student + Enrollment)
  assignUserToClass: (token: string, data: {
    user_id: number;
    class_id: number;
    academic_year_id?: number;
    student_name?: string;
    dob?: string;
    gender?: string;
  }) =>
    request('/enrollment/assign-user-to-class', { method: 'POST', token, body: data }),

  // Get user's class assignment
  getUserClass: (token: string, userId: number) =>
    request<{
      user_id: number;
      student_id?: number;
      class?: { id: number; name: string };
      academic_year?: string;
      roll_number?: number;
      message?: string;
    }>(`/enrollment/user/${userId}/class`, { token }),

  // Get available classes
  getClasses: (token: string) =>
    request<{
      classes: { id: number; name: string }[];
      academic_year: { id: number; name: string } | null;
    }>('/enrollment/classes', { token }),

  // Get academic years
  getAcademicYears: (token: string) =>
    request<{
      academic_years: { id: number; name: string; is_current: boolean }[];
    }>('/enrollment/academic-years', { token }),

  // Get students enrolled in a class (for attendance/marks)
  getClassStudents: (token: string, classId: number, academicYearId?: number) =>
    request<{
      class_id: number;
      class_name: string;
      academic_year_id: number;
      academic_year: string;
      students: { id: number; name: string; roll_number: string | null; enrollment_id: number }[];
      total: number;
    }>(`/enrollment/class/${classId}/students`, { token, params: { academic_year_id: academicYearId } }),
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

  deleteUserPermanently: (token: string, userId: number) =>
    request<{ status: string; user_id: number; message: string }>(
      `/users/${userId}/permanent`,
      { method: 'DELETE', token }
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
      father_name?: string;  // For STUDENT role
      mother_name?: string;  // For STUDENT role
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UPLOADS API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const uploadsApi = {
  uploadImage: async (token: string, file: File, category = 'images', prefix = '') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('prefix', prefix);

    const response = await fetch(`${API_BASE}/uploads/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new ApiError(response.status, error.detail || 'Upload failed');
    }

    return response.json() as Promise<{ status: string; file_path: string; category: string; filename: string }>;
  },

  uploadMultipleImages: async (token: string, files: File[], category = 'gallery') => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('category', category);

    const response = await fetch(`${API_BASE}/uploads/images/bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new ApiError(response.status, error.detail || 'Upload failed');
    }

    return response.json() as Promise<{
      status: string;
      uploaded: { filename: string; file_path: string }[];
      errors: { filename: string; error: string }[];
      total_uploaded: number;
      total_errors: number;
    }>;
  },

  deleteFile: async (token: string, filePath: string) => {
    const response = await fetch(`${API_BASE}/uploads/?file_path=${encodeURIComponent(filePath)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Delete failed' }));
      throw new ApiError(response.status, error.detail || 'Delete failed');
    }

    return response.json();
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ADMIN FEES API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEACHER SUBJECTS API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const teacherSubjectsApi = {
  // Get my assignments (for teachers)
  getMyAssignments: (token: string) =>
    request<{
      teacher_id: number;
      teacher_name: string;
      academic_year: string;
      classes: { class_id: number; class_name: string; subjects: { subject_id: number; subject_name: string }[] }[];
    }>('/teacher-subjects/my-assignments', { token }),

  // Admin: Assign teacher to subject
  assignTeacher: (token: string, data: {
    teacher_id: number;
    class_id: number;
    subject_id: number;
    academic_year_id?: number;
  }) =>
    request('/teacher-subjects/assign', { method: 'POST', token, body: data }),

  // Admin: Bulk assign
  bulkAssign: (token: string, data: {
    teacher_id: number;
    class_id: number;
    subject_ids: number[];
    academic_year_id?: number;
  }) =>
    request('/teacher-subjects/assign-bulk', { method: 'POST', token, body: data }),

  // Admin: Get class assignments
  getClassAssignments: (token: string, classId: number, academicYearId?: number) =>
    request(`/teacher-subjects/class/${classId}`, { token, params: { academic_year_id: academicYearId } }),

  // Admin: Remove assignment
  removeAssignment: (token: string, assignmentId: number) =>
    request(`/teacher-subjects/remove/${assignmentId}`, { method: 'DELETE', token }),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TRANSPORT API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const transportApi = {
  // Get transport status for class
  getClassTransport: (token: string, classId: number, academicYearId: number) =>
    request<{
      class_id: number;
      class_name: string;
      total_students: number;
      using_transport: number;
      students: {
        student_id: number;
        student_name: string;
        uses_transport: boolean;
        transport_charges: number;
      }[];
    }>(`/fees/transport/class/${classId}/year/${academicYearId}`, { token }),

  // Update single student transport
  updateStudentTransport: (token: string, studentId: number, transportCharges: number, academicYearId?: number) =>
    request(`/fees/transport/student/${studentId}`, {
      method: 'PUT',
      token,
      params: { transport_charges: transportCharges, academic_year_id: academicYearId },
    }),

  // Bulk update transport
  bulkUpdateTransport: (token: string, updates: { student_id: number; transport_charges: number; uses_transport: boolean }[], academicYearId?: number) =>
    request('/fees/transport/bulk', {
      method: 'PUT',
      token,
      body: { updates },
      params: { academic_year_id: academicYearId },
    }),
};

export const adminFeesApi = {
  // Fee Structure
  createFeeStructure: (token: string, data: {
    class_id: number;
    academic_year_id: number;
    annual_charges: number;
    monthly_fee: number;
  }) =>
    request('/fees/structure', { method: 'POST', token, body: data }),

  getFeeStructure: (token: string, structureId: number) =>
    request(`/fees/structure/${structureId}`, { token }),

  getFeeStructureByClassYear: (token: string, classId: number, academicYearId: number) =>
    request(`/fees/structure/class/${classId}/year/${academicYearId}`, { token }),

  updateFeeStructure: (token: string, structureId: number, data: {
    annual_charges?: number;
    monthly_fee?: number;
  }) =>
    request(`/fees/structure/${structureId}`, { method: 'PUT', token, body: data }),

  // Student Fee Profiles
  createStudentFeeProfile: (token: string, data: {
    student_id: number;
    fee_structure_id: number;
    transport_charges?: number;
    concession_amount?: number;
    concession_reason?: string;
  }) =>
    request('/fees/profile', { method: 'POST', token, body: data }),

  bulkCreateFeeProfiles: (token: string, data: {
    fee_structure_id: number;
    student_ids: number[];
    default_transport_charges?: number;
    default_concession?: number;
  }) =>
    request('/fees/profile/bulk', { method: 'POST', token, body: data }),

  getStudentFeeProfile: (token: string, studentId: number, academicYearId: number) =>
    request(`/fees/profile/student/${studentId}/year/${academicYearId}`, { token }),

  updateStudentFeeProfile: (token: string, profileId: number, data: {
    transport_charges?: number;
    transport_locked?: boolean;
    concession_amount?: number;
    concession_reason?: string;
    is_locked?: boolean;
  }) =>
    request(`/fees/profile/${profileId}`, { method: 'PUT', token, body: data }),

  // Payments
  recordCashPayment: (token: string, data: {
    student_fee_profile_id: number;
    amount_paid: number;
    payment_frequency: string;
    receipt_number?: string;
    paid_at?: string;
    remarks?: string;
  }) =>
    request('/fees/payment/cash', { method: 'POST', token, body: data }),

  getPaymentHistory: (token: string, profileId: number) =>
    request(`/fees/payment/history/${profileId}`, { token }),

  verifyPayment: (token: string, paymentId: number, data: {
    is_verified: boolean;
    remarks?: string;
  }) =>
    request(`/fees/payment/${paymentId}/verify`, { method: 'PUT', token, body: data }),

  // Reports
  getClassFeeSummary: (token: string, classId: number, academicYearId: number) =>
    request(`/fees/summary/class/${classId}/year/${academicYearId}`, { token }),

  exportFeeReport: (token: string, filters: {
    academic_year_id?: number;
    class_id?: number;
    payment_status?: string;
  }) =>
    request('/fees/reports/export/excel', { method: 'POST', token, body: filters }),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCHOOL DATA API (Classes, Academic Years)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const schoolApi = {
  getClasses: (token: string) =>
    request<{ id: number; name: string; section?: string }[]>('/admin/classes/', { token }).then(
      (data: any) => data.classes || []
    ),

  getAcademicYears: (token: string) =>
    request<{ id: number; year: string; start_date: string; end_date: string; is_current: boolean }[]>('/academic-years/', { token }).then(
      (data: any) => (data || []).map((y: any) => ({ id: y.id, name: y.year, start_date: y.start_date, end_date: y.end_date, is_current: y.is_current }))
    ),

  getSubjects: (token: string) =>
    request<{ id: number; name: string }[]>('/subjects/', { token }),

  getStudentsByClass: (token: string, classId: number) =>
    request<{ students: { id: number; name: string; roll_number?: string }[] }>(`/enrollment/class/${classId}/students`, { token }).then(
      (data: any) => data.students || []
    ),
};

export { ApiError };


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ADMIN CLASSES API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const classesApi = {
  // List classes
  list: (token: string, academicYearId?: number) =>
    request("/admin/classes/", { token, params: { academic_year_id: academicYearId } }),

  // Create class
  create: (token: string, data: { name: string; section?: string; academic_year_id: number }) =>
    request("/admin/classes/", { method: "POST", token, body: data }),

  // Assign subject to class
  assignSubject: (token: string, classId: number, data: { subject_id: number; academic_year_id: number }) =>
    request(`/admin/classes/${classId}/subjects`, { method: "POST", token, body: data }),

  // Get class subjects
  getSubjects: (token: string, classId: number, academicYearId?: number) =>
    request(`/admin/classes/${classId}/subjects`, { token, params: { academic_year_id: academicYearId } }),

  // Create exam for class
  createExam: (token: string, classId: number, data: { name: string; exam_type: string; academic_year_id: number; exam_date?: string }) =>
    request(`/admin/classes/${classId}/exams`, { method: "POST", token, body: data }),

  // Get class exams
  getExams: (token: string, classId: number, academicYearId?: number) =>
    request(`/admin/classes/${classId}/exams`, { token, params: { academic_year_id: academicYearId } }),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ADMIN NOTIFICATIONS API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const adminNotificationsApi = {
  // List all notifications
  list: (token: string, limit = 50, offset = 0) =>
    request<{ notifications: any[]; total: number }>("/notifications/list", {
      token,
      params: { limit, offset }
    }),

  // Create notification
  create: (token: string, data: {
    title: string;
    message: string;
    notification_type: string;
    priority: string;
    target_audience: string;
    target_class_id?: number;
    target_user_id?: number;
    academic_year_id: number;
    scheduled_for?: string;
  }) =>
    request("/notifications/create", { method: "POST", token, body: data }),

  // Send notification
  send: (token: string, notificationId: number) =>
    request(`/notifications/${notificationId}/send`, { method: "POST", token }),

  // Send quick notice
  sendNotice: (token: string, data: {
    notice_type: string;
    title: string;
    message: string;
    effective_date?: string;
    end_date?: string;
  }) =>
    request("/notifications/send-notice", { method: "POST", token, body: data }),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SYSTEM SETTINGS API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const settingsApi = {
  get: (token: string) =>
    request<{
      school: any;
      notifications: any;
      security: any;
      updated_at: string | null;
    }>('/settings/', { token }),

  update: (token: string, data: {
    school?: any;
    notifications?: any;
    security?: any;
  }) =>
    request<{
      school: any;
      notifications: any;
      security: any;
      updated_at: string | null;
    }>('/settings/', { method: 'PUT', token, body: data }),

  getPublic: () => request<any>('/settings/public'),
};
