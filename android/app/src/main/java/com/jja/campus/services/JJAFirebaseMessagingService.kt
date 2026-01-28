package com.jja.campus.services

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.jja.campus.MainActivity
import com.jja.campus.R
import com.jja.campus.core.datastore.AuthDataStore
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class JJAFirebaseMessagingService : FirebaseMessagingService() {

    @Inject
    lateinit var authDataStore: AuthDataStore

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Save the new token and send to backend
        serviceScope.launch {
            authDataStore.saveFcmToken(token)
            // TODO: Send token to backend when user is logged in
        }
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        // Handle notification payload
        remoteMessage.notification?.let { notification ->
            showNotification(
                title = notification.title ?: "JJA Campus",
                body = notification.body ?: "",
                data = remoteMessage.data
            )
        }

        // Handle data payload
        if (remoteMessage.data.isNotEmpty()) {
            handleDataPayload(remoteMessage.data)
        }
    }

    private fun handleDataPayload(data: Map<String, String>) {
        val type = data["type"] ?: return
        val title = data["title"] ?: "JJA Campus"
        val body = data["body"] ?: data["message"] ?: ""

        when (type) {
            "attendance" -> showNotification(title, body, data, CHANNEL_ATTENDANCE)
            "homework" -> showNotification(title, body, data, CHANNEL_HOMEWORK)
            "fee" -> showNotification(title, body, data, CHANNEL_FEES)
            "result" -> showNotification(title, body, data, CHANNEL_RESULTS)
            "announcement" -> showNotification(title, body, data, CHANNEL_ANNOUNCEMENTS)
            else -> showNotification(title, body, data)
        }
    }

    private fun showNotification(
        title: String,
        body: String,
        data: Map<String, String>,
        channelId: String = CHANNEL_GENERAL
    ) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Create notification channel for Android O+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                getChannelName(channelId),
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = getChannelDescription(channelId)
            }
            notificationManager.createNotificationChannel(channel)
        }

        // Create intent for when notification is tapped
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            // Pass data to activity
            data.forEach { (key, value) ->
                putExtra(key, value)
            }
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            System.currentTimeMillis().toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }

    private fun getChannelName(channelId: String): String {
        return when (channelId) {
            CHANNEL_ATTENDANCE -> "Attendance"
            CHANNEL_HOMEWORK -> "Homework"
            CHANNEL_FEES -> "Fees"
            CHANNEL_RESULTS -> "Results"
            CHANNEL_ANNOUNCEMENTS -> "Announcements"
            else -> "General"
        }
    }

    private fun getChannelDescription(channelId: String): String {
        return when (channelId) {
            CHANNEL_ATTENDANCE -> "Attendance notifications"
            CHANNEL_HOMEWORK -> "Homework assignments and reminders"
            CHANNEL_FEES -> "Fee payment reminders"
            CHANNEL_RESULTS -> "Exam results notifications"
            CHANNEL_ANNOUNCEMENTS -> "School announcements"
            else -> "General notifications"
        }
    }

    companion object {
        const val CHANNEL_GENERAL = "jja_general"
        const val CHANNEL_ATTENDANCE = "jja_attendance"
        const val CHANNEL_HOMEWORK = "jja_homework"
        const val CHANNEL_FEES = "jja_fees"
        const val CHANNEL_RESULTS = "jja_results"
        const val CHANNEL_ANNOUNCEMENTS = "jja_announcements"
    }
}
