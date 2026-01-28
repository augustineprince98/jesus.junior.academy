package com.jja.campus.data.model

import com.google.gson.annotations.SerializedName

// ==================== Attendance Models ====================

data class AttendanceRecord(
    val id: Int,
    @SerializedName("student_id") val studentId: Int,
    @SerializedName("student_name") val studentName: String?,
    val date: String,
    val status: String, // PRESENT, ABSENT, LATE, HALF_DAY
    val remarks: String?,
    @SerializedName("marked_by") val markedBy: Int?,
    @SerializedName("marked_at") val markedAt: String?
)

data class AttendanceSummary(
    @SerializedName("student_id") val studentId: Int,
    @SerializedName("student_name") val studentName: String?,
    val month: Int?,
    val year: Int?,
    @SerializedName("total_days") val totalDays: Int,
    @SerializedName("present_days") val presentDays: Int,
    @SerializedName("absent_days") val absentDays: Int,
    @SerializedName("late_days") val lateDays: Int,
    val percentage: Double,
    val records: List<AttendanceRecord>?
)

data class MarkAttendanceRequest(
    @SerializedName("class_id") val classId: Int,
    val date: String,
    val attendance: List<StudentAttendance>
)

data class StudentAttendance(
    @SerializedName("student_id") val studentId: Int,
    val status: String,
    val remarks: String? = null
)

// ==================== Homework Models ====================

data class Homework(
    val id: Int,
    val title: String,
    val description: String,
    @SerializedName("class_id") val classId: Int,
    @SerializedName("class_name") val className: String?,
    @SerializedName("subject_id") val subjectId: Int,
    @SerializedName("subject_name") val subjectName: String?,
    @SerializedName("assigned_date") val assignedDate: String,
    @SerializedName("due_date") val dueDate: String,
    @SerializedName("is_published") val isPublished: Boolean,
    @SerializedName("created_by") val createdBy: Int?,
    @SerializedName("teacher_name") val teacherName: String?,
    val attachments: List<String>?
)

data class CreateHomeworkRequest(
    val title: String,
    val description: String,
    @SerializedName("class_id") val classId: Int,
    @SerializedName("subject_id") val subjectId: Int,
    @SerializedName("due_date") val dueDate: String,
    @SerializedName("is_published") val isPublished: Boolean = true
)

// ==================== Fee Models ====================

data class Fee(
    val id: Int,
    @SerializedName("student_id") val studentId: Int,
    @SerializedName("student_name") val studentName: String?,
    @SerializedName("fee_type") val feeType: String,
    val amount: Double,
    @SerializedName("due_date") val dueDate: String,
    val status: String, // PENDING, PAID, PARTIAL, OVERDUE
    @SerializedName("paid_amount") val paidAmount: Double?,
    @SerializedName("payment_date") val paymentDate: String?,
    val description: String?
)

// Alias for Fee used in screens
typealias FeeRecord = Fee

data class FeeSummary(
    @SerializedName("student_id") val studentId: Int,
    @SerializedName("student_name") val studentName: String?,
    @SerializedName("total_fees") val totalFees: Double,
    @SerializedName("total_amount") val totalAmount: Double = 0.0,
    @SerializedName("paid_amount") val paidAmount: Double,
    @SerializedName("pending_amount") val pendingAmount: Double,
    @SerializedName("overdue_amount") val overdueAmount: Double,
    @SerializedName("next_due_date") val nextDueDate: String? = null,
    val fees: List<Fee>?,
    val records: List<Fee>? = null
) {
    // Provide totalAmount from totalFees if not set
    fun resolveTotalAmount(): Double = if (totalAmount > 0) totalAmount else totalFees
}

// ==================== Result/Exam Models ====================

data class Exam(
    val id: Int,
    val name: String,
    @SerializedName("exam_type") val examType: String,
    @SerializedName("start_date") val startDate: String,
    @SerializedName("end_date") val endDate: String,
    @SerializedName("academic_year_id") val academicYearId: Int,
    @SerializedName("is_published") val isPublished: Boolean
)

data class ExamResult(
    val id: Int,
    @SerializedName("student_id") val studentId: Int,
    @SerializedName("student_name") val studentName: String?,
    @SerializedName("exam_id") val examId: Int,
    @SerializedName("exam_name") val examName: String?,
    @SerializedName("class_id") val classId: Int,
    @SerializedName("class_name") val className: String?,
    @SerializedName("total_marks") val totalMarks: Double,
    @SerializedName("obtained_marks") val obtainedMarks: Double,
    val percentage: Double,
    val grade: String?,
    val rank: Int?,
    @SerializedName("subject_results") val subjectResults: List<SubjectResult>?
)

data class SubjectResult(
    @SerializedName("subject_id") val subjectId: Int,
    @SerializedName("subject_name") val subjectName: String,
    @SerializedName("max_marks") val maxMarks: Double,
    @SerializedName("obtained_marks") val obtainedMarks: Double,
    val grade: String?
)

data class ReportCard(
    val id: Int,
    @SerializedName("student_id") val studentId: Int,
    @SerializedName("student_name") val studentName: String?,
    @SerializedName("exam_id") val examId: Int,
    @SerializedName("exam_name") val examName: String?,
    @SerializedName("class_name") val className: String?,
    @SerializedName("total_marks") val totalMarks: Double,
    @SerializedName("obtained_marks") val obtainedMarks: Double,
    val percentage: Double,
    val grade: String?,
    val rank: Int?,
    @SerializedName("exam_date") val examDate: String?,
    val remarks: String?,
    @SerializedName("subject_results") val subjectResults: List<SubjectResult>?
)

// ==================== Notification Models ====================

data class Notification(
    val id: Int,
    val title: String,
    val message: String,
    @SerializedName("notification_type") val notificationType: String,
    val priority: String,
    @SerializedName("is_read") val isRead: Boolean,
    @SerializedName("read_at") val readAt: String?,
    @SerializedName("sent_at") val sentAt: String?,
    @SerializedName("created_at") val createdAt: String?
)

data class UnreadCountResponse(
    val count: Int
)
