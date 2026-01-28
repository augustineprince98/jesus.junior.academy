package com.jja.campus.ui.screens.results

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jja.campus.data.api.JJAApiService
import com.jja.campus.data.model.ReportCard
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ResultsViewModel @Inject constructor(
    private val api: JJAApiService
) : ViewModel() {

    private val _uiState = MutableStateFlow(ResultsUiState())
    val uiState: StateFlow<ResultsUiState> = _uiState.asStateFlow()

    private val _selectedResult = MutableStateFlow<ReportCard?>(null)
    val selectedResult: StateFlow<ReportCard?> = _selectedResult.asStateFlow()

    init {
        loadResults()
    }

    fun loadResults(studentId: Int = 0, examId: Int? = null) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response = api.getStudentReportCards(studentId, examId)
                if (response.isSuccessful) {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            results = response.body() ?: emptyList()
                        )
                    }
                } else {
                    _uiState.update {
                        it.copy(isLoading = false, error = "Failed to load results")
                    }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(isLoading = false, error = e.message ?: "Network error")
                }
            }
        }
    }

    fun selectResult(result: ReportCard?) {
        _selectedResult.value = result
    }
}

data class ResultsUiState(
    val isLoading: Boolean = false,
    val results: List<ReportCard> = emptyList(),
    val error: String? = null
)
