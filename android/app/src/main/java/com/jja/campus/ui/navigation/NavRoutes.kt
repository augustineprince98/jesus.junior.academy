package com.jja.campus.ui.navigation

sealed class NavRoutes(val route: String) {
    // Auth routes
    data object Splash : NavRoutes("splash")
    data object Login : NavRoutes("login")
    data object Register : NavRoutes("register")
    data object ForgotPassword : NavRoutes("forgot_password")

    // Main routes
    data object Dashboard : NavRoutes("dashboard")
    data object Attendance : NavRoutes("attendance")
    data object Homework : NavRoutes("homework")
    data object Fees : NavRoutes("fees")
    data object Results : NavRoutes("results")
    data object Notifications : NavRoutes("notifications")
    data object Profile : NavRoutes("profile")
    data object Settings : NavRoutes("settings")

    // Detail routes
    data object HomeworkDetail : NavRoutes("homework/{homeworkId}") {
        fun createRoute(homeworkId: Int) = "homework/$homeworkId"
    }
    data object ResultDetail : NavRoutes("result/{examId}") {
        fun createRoute(examId: Int) = "result/$examId"
    }
    data object StudentDetail : NavRoutes("student/{studentId}") {
        fun createRoute(studentId: Int) = "student/$studentId"
    }
    data object ClassDetail : NavRoutes("class/{classId}") {
        fun createRoute(classId: Int) = "class/$classId"
    }

    // Admin routes
    data object ManageClasses : NavRoutes("admin/classes")
    data object ManageTeachers : NavRoutes("admin/teachers")
    data object ManageStudents : NavRoutes("admin/students")
    data object ManageFees : NavRoutes("admin/fees")
    data object Approvals : NavRoutes("admin/approvals")

    // Teacher routes
    data object MarkAttendance : NavRoutes("teacher/mark_attendance")
    data object CreateHomework : NavRoutes("teacher/create_homework")
    data object ClassStudents : NavRoutes("teacher/class_students")
}

// Bottom navigation items based on user role
enum class BottomNavItem(
    val route: String,
    val title: String,
    val icon: String // Icon name from Material Icons
) {
    // Common
    DASHBOARD("dashboard", "Home", "home"),
    NOTIFICATIONS("notifications", "Alerts", "notifications"),
    PROFILE("profile", "Profile", "person"),

    // Student/Parent specific
    ATTENDANCE("attendance", "Attendance", "fact_check"),
    HOMEWORK("homework", "Homework", "assignment"),
    FEES("fees", "Fees", "payments"),
    RESULTS("results", "Results", "grade"),

    // Teacher specific
    MARK_ATTENDANCE("teacher/mark_attendance", "Attendance", "how_to_reg"),
    MY_CLASSES("teacher/class_students", "Classes", "groups"),

    // Admin specific
    MANAGE("admin/classes", "Manage", "admin_panel_settings"),
    APPROVALS("admin/approvals", "Approvals", "approval");

    companion object {
        fun getItemsForRole(role: String): List<BottomNavItem> {
            return when (role.uppercase()) {
                "ADMIN" -> listOf(DASHBOARD, MANAGE, APPROVALS, NOTIFICATIONS, PROFILE)
                "CLASS_TEACHER", "TEACHER" -> listOf(DASHBOARD, MARK_ATTENDANCE, MY_CLASSES, NOTIFICATIONS, PROFILE)
                "PARENT" -> listOf(DASHBOARD, ATTENDANCE, HOMEWORK, FEES, RESULTS)
                "STUDENT" -> listOf(DASHBOARD, ATTENDANCE, HOMEWORK, RESULTS, PROFILE)
                else -> listOf(DASHBOARD, NOTIFICATIONS, PROFILE)
            }
        }
    }
}
