package com.jja.campus.ui.screens.fees

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jja.campus.data.api.JJAApiService
import com.jja.campus.data.model.FeeRecord
import com.jja.campus.data.model.FeeSummary
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class FeesViewModel @Inject constructor(
    private val api: JJAApiService
) : ViewModel() {

    private val _uiState = MutableStateFlow(FeesUiState())
    val uiState: StateFlow<FeesUiState> = _uiState.asStateFlow()

    init {
        loadFees()
    }

    fun loadFees(studentId: Int = 0) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response = api.getFeeSummary(studentId)
                if (response.isSuccessful && response.body() != null) {
                    val summary = response.body()!!
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            summary = summary,
                            records = summary.fees ?: emptyList()
                        )
                    }
                } else {
                    _uiState.update {
                        it.copy(isLoading = false, error = "Failed to load fee details")
                    }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(isLoading = false, error = e.message ?: "Network error")
                }
            }
        }
    }
}

data class FeesUiState(
    val isLoading: Boolean = false,
    val summary: FeeSummary? = null,
    val records: List<FeeRecord> = emptyList(),
    val paymentHistory: List<FeeRecord> = emptyList(),
    val error: String? = null
)
