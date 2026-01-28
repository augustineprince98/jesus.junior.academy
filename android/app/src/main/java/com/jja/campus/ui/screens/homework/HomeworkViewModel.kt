package com.jja.campus.ui.screens.homework

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jja.campus.data.api.JJAApiService
import com.jja.campus.data.model.Homework
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeworkViewModel @Inject constructor(
    private val api: JJAApiService
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeworkUiState())
    val uiState: StateFlow<HomeworkUiState> = _uiState.asStateFlow()

    private val _selectedHomework = MutableStateFlow<Homework?>(null)
    val selectedHomework: StateFlow<Homework?> = _selectedHomework.asStateFlow()

    init {
        loadHomework()
    }

    fun loadHomework(classId: Int? = null, subjectId: Int? = null) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response = api.getHomework(classId, subjectId)
                if (response.isSuccessful) {
                    _uiState.update { it.copy(isLoading = false, homeworkList = response.body() ?: emptyList()) }
                } else {
                    _uiState.update { it.copy(isLoading = false, error = "Failed to load homework") }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    fun loadHomeworkDetail(homeworkId: Int) {
        viewModelScope.launch {
            try {
                val response = api.getHomeworkDetail(homeworkId)
                if (response.isSuccessful) {
                    _selectedHomework.value = response.body()
                }
            } catch (_: Exception) {}
        }
    }
}

data class HomeworkUiState(
    val isLoading: Boolean = false,
    val homeworkList: List<Homework> = emptyList(),
    val error: String? = null
)
