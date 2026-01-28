package com.jja.campus.core.datastore

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthDataStore @Inject constructor(
    private val dataStore: DataStore<Preferences>
) {
    companion object {
        private val ACCESS_TOKEN = stringPreferencesKey("access_token")
        private val REFRESH_TOKEN = stringPreferencesKey("refresh_token")
        private val USER_ID = intPreferencesKey("user_id")
        private val USER_NAME = stringPreferencesKey("user_name")
        private val USER_PHONE = stringPreferencesKey("user_phone")
        private val USER_EMAIL = stringPreferencesKey("user_email")
        private val USER_ROLE = stringPreferencesKey("user_role")
        private val IS_LOGGED_IN = booleanPreferencesKey("is_logged_in")
        private val FCM_TOKEN = stringPreferencesKey("fcm_token")
    }

    val accessToken: Flow<String?> = dataStore.data.map { it[ACCESS_TOKEN] }
    val refreshToken: Flow<String?> = dataStore.data.map { it[REFRESH_TOKEN] }
    val userId: Flow<Int?> = dataStore.data.map { it[USER_ID] }
    val userName: Flow<String?> = dataStore.data.map { it[USER_NAME] }
    val userPhone: Flow<String?> = dataStore.data.map { it[USER_PHONE] }
    val userEmail: Flow<String?> = dataStore.data.map { it[USER_EMAIL] }
    val userRole: Flow<String?> = dataStore.data.map { it[USER_ROLE] }
    val isLoggedIn: Flow<Boolean> = dataStore.data.map { it[IS_LOGGED_IN] ?: false }
    val fcmToken: Flow<String?> = dataStore.data.map { it[FCM_TOKEN] }

    suspend fun saveAuthData(
        accessToken: String,
        refreshToken: String,
        userId: Int,
        userName: String,
        userPhone: String,
        userEmail: String?,
        userRole: String
    ) {
        dataStore.edit { prefs ->
            prefs[ACCESS_TOKEN] = accessToken
            prefs[REFRESH_TOKEN] = refreshToken
            prefs[USER_ID] = userId
            prefs[USER_NAME] = userName
            prefs[USER_PHONE] = userPhone
            userEmail?.let { prefs[USER_EMAIL] = it }
            prefs[USER_ROLE] = userRole
            prefs[IS_LOGGED_IN] = true
        }
    }

    suspend fun updateTokens(accessToken: String, refreshToken: String) {
        dataStore.edit { prefs ->
            prefs[ACCESS_TOKEN] = accessToken
            prefs[REFRESH_TOKEN] = refreshToken
        }
    }

    suspend fun updateUserData(name: String, email: String?, phone: String?) {
        dataStore.edit { prefs ->
            prefs[USER_NAME] = name
            email?.let { prefs[USER_EMAIL] = it }
            phone?.let { prefs[USER_PHONE] = it }
        }
    }

    suspend fun saveFcmToken(token: String) {
        dataStore.edit { prefs ->
            prefs[FCM_TOKEN] = token
        }
    }

    suspend fun clearAuthData() {
        dataStore.edit { prefs ->
            prefs.remove(ACCESS_TOKEN)
            prefs.remove(REFRESH_TOKEN)
            prefs.remove(USER_ID)
            prefs.remove(USER_NAME)
            prefs.remove(USER_PHONE)
            prefs.remove(USER_EMAIL)
            prefs.remove(USER_ROLE)
            prefs[IS_LOGGED_IN] = false
        }
    }
}
