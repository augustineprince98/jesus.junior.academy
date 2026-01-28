package com.jja.campus.data.repository

import com.jja.campus.core.datastore.AuthDataStore
import com.jja.campus.core.network.NetworkResult
import com.jja.campus.data.api.JJAApiService
import com.jja.campus.data.model.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val api: JJAApiService,
    private val authDataStore: AuthDataStore
) {
    val isLoggedIn: Flow<Boolean> = authDataStore.isLoggedIn
    val currentUserRole: Flow<String?> = authDataStore.userRole
    val currentUserName: Flow<String?> = authDataStore.userName
    val currentUserId: Flow<Int?> = authDataStore.userId

    suspend fun login(phone: String, password: String): NetworkResult<User> {
        return try {
            val response = api.login(LoginRequest(phone, password))
            if (response.isSuccessful && response.body() != null) {
                val loginResponse = response.body()!!

                // Save auth data to DataStore
                authDataStore.saveAuthData(
                    accessToken = loginResponse.accessToken,
                    refreshToken = loginResponse.refreshToken,
                    userId = loginResponse.user.id,
                    userName = loginResponse.user.name,
                    userPhone = loginResponse.user.phone,
                    userEmail = loginResponse.user.email,
                    userRole = loginResponse.user.role
                )

                NetworkResult.Success(loginResponse.user)
            } else {
                val errorBody = response.errorBody()?.string() ?: "Login failed"
                NetworkResult.Error(errorBody)
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.message ?: "Network error")
        }
    }

    suspend fun register(request: RegisterRequest): NetworkResult<User> {
        return try {
            val response = api.register(request)
            if (response.isSuccessful && response.body()?.data != null) {
                NetworkResult.Success(response.body()!!.data!!)
            } else {
                val errorBody = response.errorBody()?.string() ?: "Registration failed"
                NetworkResult.Error(errorBody)
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.message ?: "Network error")
        }
    }

    suspend fun requestPasswordReset(phone: String): NetworkResult<Unit> {
        return try {
            val response = api.requestPasswordReset(PasswordResetRequest(phone))
            if (response.isSuccessful) {
                NetworkResult.Success(Unit)
            } else {
                val errorBody = response.errorBody()?.string() ?: "Request failed"
                NetworkResult.Error(errorBody)
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.message ?: "Network error")
        }
    }

    suspend fun verifyPasswordReset(phone: String, otp: String, newPassword: String): NetworkResult<Unit> {
        return try {
            val response = api.verifyPasswordReset(PasswordResetVerify(phone, otp, newPassword))
            if (response.isSuccessful) {
                NetworkResult.Success(Unit)
            } else {
                val errorBody = response.errorBody()?.string() ?: "Verification failed"
                NetworkResult.Error(errorBody)
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.message ?: "Network error")
        }
    }

    suspend fun refreshToken(): NetworkResult<Unit> {
        return try {
            val refreshToken = authDataStore.refreshToken.first() ?: return NetworkResult.Error("No refresh token")
            val response = api.refreshToken(RefreshTokenRequest(refreshToken))
            if (response.isSuccessful && response.body() != null) {
                val loginResponse = response.body()!!
                authDataStore.updateTokens(loginResponse.accessToken, loginResponse.refreshToken)
                NetworkResult.Success(Unit)
            } else {
                NetworkResult.Error("Token refresh failed")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.message ?: "Network error")
        }
    }

    suspend fun getCurrentUser(): NetworkResult<User> {
        return try {
            val response = api.getCurrentUser()
            if (response.isSuccessful && response.body() != null) {
                NetworkResult.Success(response.body()!!)
            } else {
                NetworkResult.Error("Failed to get user")
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.message ?: "Network error")
        }
    }

    suspend fun logout() {
        try {
            api.logout()
        } catch (_: Exception) {
            // Ignore API errors during logout
        }
        authDataStore.clearAuthData()
    }

    suspend fun changePassword(currentPassword: String, newPassword: String): NetworkResult<Unit> {
        return try {
            val response = api.changePassword(ChangePasswordRequest(currentPassword, newPassword))
            if (response.isSuccessful) {
                NetworkResult.Success(Unit)
            } else {
                val errorBody = response.errorBody()?.string() ?: "Failed to change password"
                NetworkResult.Error(errorBody)
            }
        } catch (e: Exception) {
            NetworkResult.Error(e.message ?: "Network error")
        }
    }
}
