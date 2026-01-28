package com.jja.campus.data.model

import com.google.gson.annotations.SerializedName

// ==================== People Models ====================

data class Student(
    val id: Int,
    val name: String,
    @SerializedName("admission_no") val admissionNo: String?,
    val dob: String?,
    val gender: String?,
    @SerializedName("profile_image") val profileImage: String?,
    @SerializedName("class_id") val classId: Int?,
    @SerializedName("class_name") val className: String?
)

data class Parent(
    val id: Int,
    val name: String,
    val phone: String?,
    val email: String?,
    val relation: String?,
    val students: List<Student>?
)

data class Teacher(
    val id: Int,
    val name: String,
    val phone: String?,
    val email: String?,
    @SerializedName("employee_id") val employeeId: String?,
    val subjects: List<Subject>?,
    @SerializedName("class_teacher_of") val classTeacherOf: SchoolClass?
)

// ==================== Class Models ====================

data class SchoolClass(
    val id: Int,
    val name: String,
    val section: String?,
    @SerializedName("academic_year_id") val academicYearId: Int,
    @SerializedName("class_teacher_id") val classTeacherId: Int?,
    @SerializedName("class_teacher") val classTeacher: Teacher?,
    @SerializedName("student_count") val studentCount: Int?
)

data class Subject(
    val id: Int,
    val name: String,
    val code: String?
)

data class AcademicYear(
    val id: Int,
    val name: String,
    @SerializedName("start_date") val startDate: String,
    @SerializedName("end_date") val endDate: String,
    @SerializedName("is_current") val isCurrent: Boolean
)

// ==================== Dashboard Models ====================

data class DashboardStats(
    @SerializedName("total_students") val totalStudents: Int?,
    @SerializedName("total_teachers") val totalTeachers: Int?,
    @SerializedName("total_classes") val totalClasses: Int?,
    @SerializedName("attendance_today") val attendanceToday: AttendanceStats?,
    @SerializedName("pending_fees") val pendingFees: Double?,
    @SerializedName("upcoming_events") val upcomingEvents: List<Event>?,
    @SerializedName("recent_notifications") val recentNotifications: List<Notification>?,

    // For students/parents
    @SerializedName("student_info") val studentInfo: Student?,
    @SerializedName("attendance_percentage") val attendancePercentage: Double?,
    @SerializedName("pending_homework") val pendingHomework: Int?,
    @SerializedName("fee_balance") val feeBalance: Double?
)

data class AttendanceStats(
    val present: Int,
    val absent: Int,
    val late: Int,
    val total: Int,
    val percentage: Double
)

data class Event(
    val id: Int,
    val title: String,
    val description: String?,
    val date: String,
    @SerializedName("event_type") val eventType: String,
    val location: String?
)
