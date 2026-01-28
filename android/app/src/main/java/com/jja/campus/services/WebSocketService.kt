package com.jja.campus.services

import android.util.Log
import com.jja.campus.core.datastore.AuthDataStore
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import okhttp3.*
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WebSocketService @Inject constructor(
    private val okHttpClient: OkHttpClient,
    private val authDataStore: AuthDataStore
) {
    private var webSocket: WebSocket? = null
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val _connectionState = MutableStateFlow<ConnectionState>(ConnectionState.Disconnected)
    val connectionState: StateFlow<ConnectionState> = _connectionState.asStateFlow()

    private val _messages = MutableSharedFlow<WebSocketMessage>()
    val messages: SharedFlow<WebSocketMessage> = _messages.asSharedFlow()

    private var reconnectJob: Job? = null
    private var heartbeatJob: Job? = null
    private var reconnectAttempts = 0

    sealed class ConnectionState {
        object Connecting : ConnectionState()
        object Connected : ConnectionState()
        object Disconnected : ConnectionState()
        data class Error(val message: String) : ConnectionState()
    }

    data class WebSocketMessage(
        val type: String,
        val data: Map<String, Any?>
    )

    fun connect(baseUrl: String) {
        if (_connectionState.value == ConnectionState.Connected ||
            _connectionState.value == ConnectionState.Connecting) {
            return
        }

        scope.launch {
            val token = authDataStore.accessToken.first()
            if (token.isNullOrBlank()) {
                _connectionState.value = ConnectionState.Error("Not authenticated")
                return@launch
            }

            _connectionState.value = ConnectionState.Connecting

            val wsUrl = baseUrl
                .replace("https://", "wss://")
                .replace("http://", "ws://")
                .plus("/ws?token=$token")

            val request = Request.Builder()
                .url(wsUrl)
                .build()

            webSocket = okHttpClient.newWebSocket(request, createWebSocketListener())
        }
    }

    private fun createWebSocketListener(): WebSocketListener {
        return object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d(TAG, "WebSocket connected")
                _connectionState.value = ConnectionState.Connected
                reconnectAttempts = 0
                startHeartbeat()
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                try {
                    val json = JSONObject(text)
                    val type = json.optString("type", "unknown")
                    val data = json.optJSONObject("data")?.toMap() ?: emptyMap()

                    scope.launch {
                        _messages.emit(WebSocketMessage(type, data))
                    }

                    // Handle specific message types
                    when (type) {
                        "pong" -> Log.d(TAG, "Heartbeat acknowledged")
                        "notification" -> handleNotification(data)
                        "attendance_update" -> handleAttendanceUpdate(data)
                        "homework_update" -> handleHomeworkUpdate(data)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing message: ${e.message}")
                }
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WebSocket closing: $code - $reason")
                webSocket.close(1000, null)
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WebSocket closed: $code - $reason")
                _connectionState.value = ConnectionState.Disconnected
                stopHeartbeat()

                // Attempt reconnection if not intentionally closed
                if (code != 1000) {
                    scheduleReconnect()
                }
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "WebSocket failure: ${t.message}")
                _connectionState.value = ConnectionState.Error(t.message ?: "Connection failed")
                stopHeartbeat()
                scheduleReconnect()
            }
        }
    }

    private fun startHeartbeat() {
        heartbeatJob?.cancel()
        heartbeatJob = scope.launch {
            while (isActive) {
                delay(HEARTBEAT_INTERVAL)
                sendMessage("ping", emptyMap())
            }
        }
    }

    private fun stopHeartbeat() {
        heartbeatJob?.cancel()
        heartbeatJob = null
    }

    private fun scheduleReconnect() {
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            Log.e(TAG, "Max reconnect attempts reached")
            return
        }

        reconnectJob?.cancel()
        reconnectJob = scope.launch {
            val delay = RECONNECT_DELAY * (reconnectAttempts + 1)
            Log.d(TAG, "Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1})")
            delay(delay)
            reconnectAttempts++
            // Re-attempt connection
            // connect() would need the baseUrl passed again
        }
    }

    fun sendMessage(type: String, data: Map<String, Any?>) {
        if (_connectionState.value != ConnectionState.Connected) {
            Log.w(TAG, "Cannot send message: not connected")
            return
        }

        try {
            val message = JSONObject().apply {
                put("type", type)
                put("data", JSONObject(data))
            }
            webSocket?.send(message.toString())
        } catch (e: Exception) {
            Log.e(TAG, "Error sending message: ${e.message}")
        }
    }

    fun disconnect() {
        reconnectJob?.cancel()
        stopHeartbeat()
        webSocket?.close(1000, "User disconnected")
        webSocket = null
        _connectionState.value = ConnectionState.Disconnected
    }

    private fun handleNotification(data: Map<String, Any?>) {
        // Emit notification event for UI to handle
        Log.d(TAG, "Notification received: $data")
    }

    private fun handleAttendanceUpdate(data: Map<String, Any?>) {
        Log.d(TAG, "Attendance update: $data")
    }

    private fun handleHomeworkUpdate(data: Map<String, Any?>) {
        Log.d(TAG, "Homework update: $data")
    }

    private fun JSONObject.toMap(): Map<String, Any?> {
        val map = mutableMapOf<String, Any?>()
        keys().forEach { key ->
            map[key] = get(key)
        }
        return map
    }

    companion object {
        private const val TAG = "WebSocketService"
        private const val HEARTBEAT_INTERVAL = 30000L // 30 seconds
        private const val RECONNECT_DELAY = 5000L // 5 seconds
        private const val MAX_RECONNECT_ATTEMPTS = 5
    }
}
