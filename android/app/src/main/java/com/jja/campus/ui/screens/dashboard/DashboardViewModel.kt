package com.jja.campus.ui.screens.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jja.campus.core.network.NetworkResult
import com.jja.campus.data.model.DashboardStats
import com.jja.campus.data.model.Notification
import com.jja.campus.data.repository.AuthRepository
import com.jja.campus.data.repository.DashboardRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val dashboardRepository: DashboardRepository
) : ViewModel() {

    val userName: Flow<String?> = authRepository.currentUserName
    val userRole: Flow<String?> = authRepository.currentUserRole

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()

    init {
        loadDashboard()
    }

    fun loadDashboard() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            when (val result = dashboardRepository.getDashboardStats()) {
                is NetworkResult.Success -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            stats = result.data,
                            error = null
                        )
                    }
                }
                is NetworkResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = result.message
                        )
                    }
                }
                is NetworkResult.Loading -> {
                    _uiState.update { it.copy(isLoading = true) }
                }
            }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            _isRefreshing.value = true
            loadDashboard()
            _isRefreshing.value = false
        }
    }

    fun loadNotifications() {
        viewModelScope.launch {
            when (val result = dashboardRepository.getNotifications(limit = 5)) {
                is NetworkResult.Success -> {
                    _uiState.update { it.copy(recentNotifications = result.data) }
                }
                else -> {}
            }
        }
    }
}

data class DashboardUiState(
    val isLoading: Boolean = false,
    val stats: DashboardStats? = null,
    val recentNotifications: List<Notification> = emptyList(),
    val error: String? = null
)
