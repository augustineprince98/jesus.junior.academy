package com.jja.campus.ui.screens.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jja.campus.core.datastore.AuthDataStore
import com.jja.campus.data.api.JJAApiService
import com.jja.campus.data.model.ChangePasswordRequest
import com.jja.campus.data.model.UpdateProfileRequest
import com.jja.campus.data.model.UserProfile
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val api: JJAApiService,
    private val authDataStore: AuthDataStore
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    val userName = authDataStore.userName
    val userEmail = authDataStore.userEmail
    val userRole = authDataStore.userRole

    init {
        loadProfile()
    }

    fun loadProfile() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response = api.getProfile()
                if (response.isSuccessful && response.body() != null) {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            user = response.body()
                        )
                    }
                } else {
                    _uiState.update {
                        it.copy(isLoading = false, error = "Failed to load profile")
                    }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(isLoading = false, error = e.message ?: "Network error")
                }
            }
        }
    }

    fun updateProfile(name: String, phone: String?, address: String?) {
        viewModelScope.launch {
            _uiState.update { it.copy(isUpdating = true) }
            try {
                val request = UpdateProfileRequest(name = name, phone = phone, address = address)
                val response = api.updateProfile(request)
                if (response.isSuccessful && response.body()?.data != null) {
                    val updatedUser = response.body()?.data!!
                    // Update local data store
                    authDataStore.updateUserData(
                        name = updatedUser.name,
                        email = updatedUser.email,
                        phone = updatedUser.phone
                    )
                    _uiState.update {
                        it.copy(
                            isUpdating = false,
                            user = updatedUser,
                            updateSuccess = true
                        )
                    }
                } else {
                    _uiState.update {
                        it.copy(isUpdating = false, updateError = "Failed to update profile")
                    }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(isUpdating = false, updateError = e.message ?: "Network error")
                }
            }
        }
    }

    fun changePassword(currentPassword: String, newPassword: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isChangingPassword = true, passwordError = null) }
            try {
                val request = ChangePasswordRequest(currentPassword, newPassword)
                val response = api.changePassword(request)
                if (response.isSuccessful) {
                    _uiState.update {
                        it.copy(
                            isChangingPassword = false,
                            passwordChangeSuccess = true
                        )
                    }
                } else {
                    _uiState.update {
                        it.copy(
                            isChangingPassword = false,
                            passwordError = "Invalid current password"
                        )
                    }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isChangingPassword = false,
                        passwordError = e.message ?: "Network error"
                    )
                }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authDataStore.clearAuthData()
            _uiState.update { it.copy(isLoggedOut = true) }
        }
    }

    fun clearUpdateSuccess() {
        _uiState.update { it.copy(updateSuccess = false, updateError = null) }
    }

    fun clearPasswordSuccess() {
        _uiState.update { it.copy(passwordChangeSuccess = false, passwordError = null) }
    }
}

data class ProfileUiState(
    val isLoading: Boolean = false,
    val isUpdating: Boolean = false,
    val isChangingPassword: Boolean = false,
    val user: UserProfile? = null,
    val error: String? = null,
    val updateSuccess: Boolean = false,
    val updateError: String? = null,
    val passwordChangeSuccess: Boolean = false,
    val passwordError: String? = null,
    val isLoggedOut: Boolean = false
)
