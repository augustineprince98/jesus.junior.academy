package com.jja.campus.ui.screens.attendance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jja.campus.core.datastore.AuthDataStore
import com.jja.campus.core.network.NetworkResult
import com.jja.campus.data.api.JJAApiService
import com.jja.campus.data.model.AttendanceRecord
import com.jja.campus.data.model.AttendanceSummary
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AttendanceViewModel @Inject constructor(
    private val api: JJAApiService,
    private val authDataStore: AuthDataStore
) : ViewModel() {

    private val _uiState = MutableStateFlow(AttendanceUiState())
    val uiState: StateFlow<AttendanceUiState> = _uiState.asStateFlow()

    init {
        loadAttendance()
    }

    fun loadAttendance() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            try {
                // Get student ID from auth data store
                val userId = authDataStore.userId.first()

                // For now, load today's attendance records
                val response = api.getTodayAttendance()
                if (response.isSuccessful) {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            records = response.body() ?: emptyList()
                        )
                    }
                } else {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = "Failed to load attendance"
                        )
                    }
                }

                // Also try to load summary if we have student context
                // This would be implemented based on user role

            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = e.message ?: "Network error"
                    )
                }
            }
        }
    }

    fun loadStudentAttendance(studentId: Int, month: Int? = null, year: Int? = null) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            try {
                val response = api.getStudentAttendance(studentId, month, year)
                if (response.isSuccessful && response.body() != null) {
                    val summary = response.body()!!
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            summary = summary,
                            records = summary.records ?: emptyList()
                        )
                    }
                } else {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = "Failed to load attendance"
                        )
                    }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = e.message ?: "Network error"
                    )
                }
            }
        }
    }
}

data class AttendanceUiState(
    val isLoading: Boolean = false,
    val summary: AttendanceSummary? = null,
    val records: List<AttendanceRecord> = emptyList(),
    val error: String? = null
)
