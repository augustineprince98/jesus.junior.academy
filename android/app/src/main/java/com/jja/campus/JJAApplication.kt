package com.jja.campus

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class JJAApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(NotificationManager::class.java)

            // Default channel
            val defaultChannel = NotificationChannel(
                CHANNEL_DEFAULT,
                "General Notifications",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "General school notifications"
            }

            // Homework channel
            val homeworkChannel = NotificationChannel(
                CHANNEL_HOMEWORK,
                "Homework",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Homework assignments and reminders"
            }

            // Attendance channel
            val attendanceChannel = NotificationChannel(
                CHANNEL_ATTENDANCE,
                "Attendance",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Attendance alerts"
            }

            // Fees channel
            val feesChannel = NotificationChannel(
                CHANNEL_FEES,
                "Fee Reminders",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Fee payment reminders"
            }

            // Urgent channel
            val urgentChannel = NotificationChannel(
                CHANNEL_URGENT,
                "Urgent Alerts",
                NotificationManager.IMPORTANCE_MAX
            ).apply {
                description = "Emergency and urgent notifications"
            }

            notificationManager.createNotificationChannels(
                listOf(defaultChannel, homeworkChannel, attendanceChannel, feesChannel, urgentChannel)
            )
        }
    }

    companion object {
        const val CHANNEL_DEFAULT = "jja_default_channel"
        const val CHANNEL_HOMEWORK = "jja_homework_channel"
        const val CHANNEL_ATTENDANCE = "jja_attendance_channel"
        const val CHANNEL_FEES = "jja_fees_channel"
        const val CHANNEL_URGENT = "jja_urgent_channel"
    }
}
