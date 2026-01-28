package com.jja.campus.ui.screens.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jja.campus.data.api.JJAApiService
import com.jja.campus.data.model.Notification
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class NotificationsViewModel @Inject constructor(
    private val api: JJAApiService
) : ViewModel() {

    private val _uiState = MutableStateFlow(NotificationsUiState())
    val uiState: StateFlow<NotificationsUiState> = _uiState.asStateFlow()

    init {
        loadNotifications()
    }

    fun loadNotifications() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response = api.getNotifications()
                if (response.isSuccessful) {
                    val notifications = response.body() ?: emptyList()
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            notifications = notifications,
                            unreadCount = notifications.count { n -> !n.isRead }
                        )
                    }
                } else {
                    _uiState.update {
                        it.copy(isLoading = false, error = "Failed to load notifications")
                    }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(isLoading = false, error = e.message ?: "Network error")
                }
            }
        }
    }

    fun markAsRead(notificationId: Int) {
        viewModelScope.launch {
            try {
                val response = api.markNotificationRead(notificationId)
                if (response.isSuccessful) {
                    _uiState.update { state ->
                        val updatedList = state.notifications.map { notification ->
                            if (notification.id == notificationId) {
                                notification.copy(isRead = true)
                            } else {
                                notification
                            }
                        }
                        state.copy(
                            notifications = updatedList,
                            unreadCount = updatedList.count { !it.isRead }
                        )
                    }
                }
            } catch (_: Exception) {}
        }
    }

    fun markAllAsRead() {
        viewModelScope.launch {
            try {
                val response = api.markAllNotificationsRead()
                if (response.isSuccessful) {
                    _uiState.update { state ->
                        state.copy(
                            notifications = state.notifications.map { it.copy(isRead = true) },
                            unreadCount = 0
                        )
                    }
                }
            } catch (_: Exception) {}
        }
    }

    fun deleteNotification(notificationId: Int) {
        viewModelScope.launch {
            try {
                val response = api.deleteNotification(notificationId)
                if (response.isSuccessful) {
                    _uiState.update { state ->
                        val updatedList = state.notifications.filter { it.id != notificationId }
                        state.copy(
                            notifications = updatedList,
                            unreadCount = updatedList.count { !it.isRead }
                        )
                    }
                }
            } catch (_: Exception) {}
        }
    }
}

data class NotificationsUiState(
    val isLoading: Boolean = false,
    val notifications: List<Notification> = emptyList(),
    val unreadCount: Int = 0,
    val error: String? = null
)
