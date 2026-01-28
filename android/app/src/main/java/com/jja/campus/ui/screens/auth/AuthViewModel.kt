package com.jja.campus.ui.screens.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jja.campus.core.network.NetworkResult
import com.jja.campus.data.model.RegisterRequest
import com.jja.campus.data.model.User
import com.jja.campus.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    val isLoggedIn: Flow<Boolean> = authRepository.isLoggedIn
    val userRole: Flow<String?> = authRepository.currentUserRole
    val userName: Flow<String?> = authRepository.currentUserName

    private val _loginState = MutableStateFlow<AuthState>(AuthState.Idle)
    val loginState: StateFlow<AuthState> = _loginState.asStateFlow()

    private val _registerState = MutableStateFlow<AuthState>(AuthState.Idle)
    val registerState: StateFlow<AuthState> = _registerState.asStateFlow()

    private val _resetPasswordState = MutableStateFlow<ResetPasswordState>(ResetPasswordState.Idle)
    val resetPasswordState: StateFlow<ResetPasswordState> = _resetPasswordState.asStateFlow()

    fun login(phone: String, password: String) {
        viewModelScope.launch {
            _loginState.value = AuthState.Loading

            when (val result = authRepository.login(phone, password)) {
                is NetworkResult.Success -> {
                    _loginState.value = AuthState.Success(result.data)
                }
                is NetworkResult.Error -> {
                    _loginState.value = AuthState.Error(result.message)
                }
                is NetworkResult.Loading -> {
                    _loginState.value = AuthState.Loading
                }
            }
        }
    }

    fun register(
        name: String,
        phone: String,
        email: String?,
        password: String,
        role: String
    ) {
        viewModelScope.launch {
            _registerState.value = AuthState.Loading

            val request = RegisterRequest(
                name = name,
                phone = phone,
                email = email?.takeIf { it.isNotBlank() },
                password = password,
                role = role
            )

            when (val result = authRepository.register(request)) {
                is NetworkResult.Success -> {
                    _registerState.value = AuthState.Success(result.data)
                }
                is NetworkResult.Error -> {
                    _registerState.value = AuthState.Error(result.message)
                }
                is NetworkResult.Loading -> {
                    _registerState.value = AuthState.Loading
                }
            }
        }
    }

    fun requestPasswordReset(phone: String) {
        viewModelScope.launch {
            _resetPasswordState.value = ResetPasswordState.Loading

            when (val result = authRepository.requestPasswordReset(phone)) {
                is NetworkResult.Success -> {
                    _resetPasswordState.value = ResetPasswordState.OtpSent
                }
                is NetworkResult.Error -> {
                    _resetPasswordState.value = ResetPasswordState.Error(result.message)
                }
                is NetworkResult.Loading -> {
                    _resetPasswordState.value = ResetPasswordState.Loading
                }
            }
        }
    }

    fun verifyOtpAndResetPassword(phone: String, otp: String, newPassword: String) {
        viewModelScope.launch {
            _resetPasswordState.value = ResetPasswordState.Loading

            when (val result = authRepository.verifyPasswordReset(phone, otp, newPassword)) {
                is NetworkResult.Success -> {
                    _resetPasswordState.value = ResetPasswordState.Success
                }
                is NetworkResult.Error -> {
                    _resetPasswordState.value = ResetPasswordState.Error(result.message)
                }
                is NetworkResult.Loading -> {
                    _resetPasswordState.value = ResetPasswordState.Loading
                }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
            _loginState.value = AuthState.Idle
        }
    }

    fun resetLoginState() {
        _loginState.value = AuthState.Idle
    }

    fun resetRegisterState() {
        _registerState.value = AuthState.Idle
    }

    fun resetPasswordResetState() {
        _resetPasswordState.value = ResetPasswordState.Idle
    }
}

sealed class AuthState {
    data object Idle : AuthState()
    data object Loading : AuthState()
    data class Success(val user: User) : AuthState()
    data class Error(val message: String) : AuthState()
}

sealed class ResetPasswordState {
    data object Idle : ResetPasswordState()
    data object Loading : ResetPasswordState()
    data object OtpSent : ResetPasswordState()
    data object Success : ResetPasswordState()
    data class Error(val message: String) : ResetPasswordState()
}
