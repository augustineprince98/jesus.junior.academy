package com.jja.campus.data.model

import com.google.gson.annotations.SerializedName

// ==================== Request Models ====================

data class LoginRequest(
    val phone: String,
    val password: String
)

data class RegisterRequest(
    val name: String,
    val phone: String,
    val email: String? = null,
    val password: String,
    val role: String,
    @SerializedName("student_id") val studentId: Int? = null,
    @SerializedName("parent_id") val parentId: Int? = null
)

data class PasswordResetRequest(
    val phone: String
)

data class PasswordResetVerify(
    val phone: String,
    val otp: String,
    @SerializedName("new_password") val newPassword: String
)

data class RefreshTokenRequest(
    @SerializedName("refresh_token") val refreshToken: String
)

data class ChangePasswordRequest(
    @SerializedName("current_password") val currentPassword: String,
    @SerializedName("new_password") val newPassword: String
)

data class UpdateProfileRequest(
    val name: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val address: String? = null
)

data class FcmTokenRequest(
    @SerializedName("fcm_token") val fcmToken: String
)

// ==================== Response Models ====================

data class LoginResponse(
    @SerializedName("access_token") val accessToken: String,
    @SerializedName("refresh_token") val refreshToken: String,
    @SerializedName("token_type") val tokenType: String,
    val user: User
)

data class User(
    val id: Int,
    val name: String,
    val phone: String,
    val email: String?,
    val role: String,
    @SerializedName("is_active") val isActive: Boolean,
    @SerializedName("is_approved") val isApproved: Boolean,
    @SerializedName("approval_status") val approvalStatus: String,
    @SerializedName("student_id") val studentId: Int?,
    @SerializedName("parent_id") val parentId: Int?,
    @SerializedName("teacher_id") val teacherId: Int?,
    @SerializedName("created_at") val createdAt: String?
)

data class UserProfile(
    val id: Int,
    val name: String,
    val phone: String,
    val email: String?,
    val role: String,
    @SerializedName("profile_image") val profileImage: String?,
    val address: String?,
    val student: Student?,
    val parent: Parent?,
    val teacher: Teacher?
)

data class ApiResponse<T>(
    val status: String,
    val message: String?,
    val data: T?
)

data class VapidKeyResponse(
    @SerializedName("publicKey") val publicKey: String
)

data class HealthResponse(
    val status: String,
    val version: String,
    val database: String
)
