package com.jja.campus.data.repository

import com.jja.campus.core.network.NetworkResult
import com.jja.campus.data.api.JJAApiService
import com.jja.campus.data.model.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DashboardRepository @Inject constructor(
    private val api: JJAApiService
) {
    suspend fun getDashboardStats(): NetworkResult<DashboardStats> {
        return try {
            val response = api.getDashboardStats()
            if (response.isSuccessful && response.body() != null) {
                NetworkResult.Success(response.body()!!)
            } else {
                NetworkResult.Error(response.errorBody()?.string() ?: "Failed to load dashboard")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.message ?: "Network error")
        }
    }

    suspend fun getNotifications(unreadOnly: Boolean = false, limit: Int = 50): NetworkResult<List<Notification>> {
        return try {
            val response = api.getNotifications(unreadOnly, limit)
            if (response.isSuccessful && response.body() != null) {
                NetworkResult.Success(response.body()!!)
            } else {
                NetworkResult.Error(response.errorBody()?.string() ?: "Failed to load notifications")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.message ?: "Network error")
        }
    }

    suspend fun getUnreadCount(): NetworkResult<Int> {
        return try {
            val response = api.getUnreadCount()
            if (response.isSuccessful && response.body() != null) {
                NetworkResult.Success(response.body()!!.count)
            } else {
                NetworkResult.Error("Failed to get unread count")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.message ?: "Network error")
        }
    }

    suspend fun markNotificationRead(notificationId: Int): NetworkResult<Unit> {
        return try {
            val response = api.markNotificationRead(notificationId)
            if (response.isSuccessful) {
                NetworkResult.Success(Unit)
            } else {
                NetworkResult.Error("Failed to mark as read")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.message ?: "Network error")
        }
    }
}
