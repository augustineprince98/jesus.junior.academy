package com.jja.campus.data.api

import com.jja.campus.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface JJAApiService {

    // ==================== Authentication ====================

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<ApiResponse<User>>

    @POST("auth/password-reset/request")
    suspend fun requestPasswordReset(@Body request: PasswordResetRequest): Response<ApiResponse<Unit>>

    @POST("auth/password-reset/verify")
    suspend fun verifyPasswordReset(@Body request: PasswordResetVerify): Response<ApiResponse<Unit>>

    @POST("auth/refresh")
    suspend fun refreshToken(@Body request: RefreshTokenRequest): Response<LoginResponse>

    @GET("auth/me")
    suspend fun getCurrentUser(): Response<User>

    @POST("auth/logout")
    suspend fun logout(): Response<ApiResponse<Unit>>

    // ==================== Dashboard ====================

    @GET("users/dashboard-stats")
    suspend fun getDashboardStats(): Response<DashboardStats>

    // ==================== Classes ====================

    @GET("classes")
    suspend fun getClasses(): Response<List<SchoolClass>>

    @GET("classes/{id}")
    suspend fun getClass(@Path("id") id: Int): Response<SchoolClass>

    @GET("classes/{id}/students")
    suspend fun getClassStudents(@Path("id") classId: Int): Response<List<Student>>

    // ==================== Attendance ====================

    @GET("attendance/today")
    suspend fun getTodayAttendance(
        @Query("class_id") classId: Int? = null
    ): Response<List<AttendanceRecord>>

    @POST("attendance/mark")
    suspend fun markAttendance(@Body request: MarkAttendanceRequest): Response<ApiResponse<Unit>>

    @GET("attendance/student/{studentId}")
    suspend fun getStudentAttendance(
        @Path("studentId") studentId: Int,
        @Query("month") month: Int? = null,
        @Query("year") year: Int? = null
    ): Response<AttendanceSummary>

    // ==================== Homework ====================

    @GET("homework")
    suspend fun getHomework(
        @Query("class_id") classId: Int? = null,
        @Query("subject_id") subjectId: Int? = null,
        @Query("date") date: String? = null
    ): Response<List<Homework>>

    @GET("homework/{id}")
    suspend fun getHomeworkDetail(@Path("id") id: Int): Response<Homework>

    @POST("homework")
    suspend fun createHomework(@Body request: CreateHomeworkRequest): Response<ApiResponse<Homework>>

    @PUT("homework/{id}")
    suspend fun updateHomework(
        @Path("id") id: Int,
        @Body request: CreateHomeworkRequest
    ): Response<ApiResponse<Homework>>

    @DELETE("homework/{id}")
    suspend fun deleteHomework(@Path("id") id: Int): Response<ApiResponse<Unit>>

    // ==================== Fees ====================

    @GET("fees/student/{studentId}")
    suspend fun getStudentFees(@Path("studentId") studentId: Int): Response<List<Fee>>

    @GET("fees/summary/{studentId}")
    suspend fun getFeeSummary(@Path("studentId") studentId: Int): Response<FeeSummary>

    @GET("fees/pending")
    suspend fun getPendingFees(): Response<List<Fee>>

    // ==================== Results ====================

    @GET("results/student/{studentId}")
    suspend fun getStudentResults(
        @Path("studentId") studentId: Int,
        @Query("exam_id") examId: Int? = null
    ): Response<List<ExamResult>>

    @GET("results/student/{studentId}/report-cards")
    suspend fun getStudentReportCards(
        @Path("studentId") studentId: Int,
        @Query("exam_id") examId: Int? = null
    ): Response<List<ReportCard>>

    @GET("results/class/{classId}")
    suspend fun getClassResults(
        @Path("classId") classId: Int,
        @Query("exam_id") examId: Int
    ): Response<List<ExamResult>>

    // ==================== Exams ====================

    @GET("exams")
    suspend fun getExams(): Response<List<Exam>>

    @GET("exams/{id}")
    suspend fun getExam(@Path("id") id: Int): Response<Exam>

    // ==================== Notifications ====================

    @GET("notifications")
    suspend fun getNotifications(
        @Query("unread_only") unreadOnly: Boolean = false,
        @Query("limit") limit: Int = 50
    ): Response<List<Notification>>

    @POST("notifications/{id}/read")
    suspend fun markNotificationRead(@Path("id") id: Int): Response<ApiResponse<Unit>>

    @POST("notifications/read-all")
    suspend fun markAllNotificationsRead(): Response<ApiResponse<Unit>>

    @DELETE("notifications/{id}")
    suspend fun deleteNotification(@Path("id") id: Int): Response<ApiResponse<Unit>>

    @GET("notifications/unread-count")
    suspend fun getUnreadCount(): Response<UnreadCountResponse>

    // ==================== Profile ====================

    @GET("users/profile")
    suspend fun getProfile(): Response<UserProfile>

    @PUT("users/profile")
    suspend fun updateProfile(@Body request: UpdateProfileRequest): Response<ApiResponse<UserProfile>>

    @POST("users/change-password")
    suspend fun changePassword(@Body request: ChangePasswordRequest): Response<ApiResponse<Unit>>

    // ==================== Push Notifications ====================

    @GET("push/vapid-public-key")
    suspend fun getVapidPublicKey(): Response<VapidKeyResponse>

    @POST("push/register-fcm")
    suspend fun registerFcmToken(@Body request: FcmTokenRequest): Response<ApiResponse<Unit>>

    // ==================== Health Check ====================

    @GET("health")
    suspend fun healthCheck(): Response<HealthResponse>
}
