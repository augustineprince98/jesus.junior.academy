package com.jja.campus.ui.screens.dashboard

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.pullrefresh.PullRefreshIndicator
import androidx.compose.material.pullrefresh.pullRefresh
import androidx.compose.material.pullrefresh.rememberPullRefreshState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@OptIn(ExperimentalMaterialApi::class)
@Composable
fun DashboardScreen(
    onNavigateToAttendance: () -> Unit,
    onNavigateToHomework: () -> Unit,
    onNavigateToFees: () -> Unit,
    onNavigateToResults: () -> Unit,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val isRefreshing by viewModel.isRefreshing.collectAsState()
    val userName by viewModel.userName.collectAsState(initial = "User")
    val userRole by viewModel.userRole.collectAsState(initial = "")

    val pullRefreshState = rememberPullRefreshState(isRefreshing, { viewModel.refresh() })

    var startAnimation by remember { mutableStateOf(false) }
    val alphaAnim = animateFloatAsState(
        targetValue = if (startAnimation) 1f else 0f,
        animationSpec = tween(durationMillis = 1000)
    )

    LaunchedEffect(Unit) {
        startAnimation = true
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .pullRefresh(pullRefreshState)
            .alpha(alphaAnim.value)
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                GreetingCard(userName = userName ?: "User")
            }

            item {
                SummaryCard(uiState.stats, userRole ?: "")
            }

            item {
                Text(
                    text = "Quick Actions",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
            }

            item {
                QuickActionsRow(
                    userRole = userRole ?: "",
                    onAttendanceClick = onNavigateToAttendance,
                    onHomeworkClick = onNavigateToHomework,
                    onFeesClick = onNavigateToFees,
                    onResultsClick = onNavigateToResults
                )
            }
        }

        PullRefreshIndicator(
            refreshing = isRefreshing,
            state = pullRefreshState,
            modifier = Modifier.align(Alignment.TopCenter)
        )
    }
}

@Composable
fun GreetingCard(userName: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        )
    ) {
        Column(
            modifier = Modifier.padding(24.dp)
        ) {
            Text(
                text = "Welcome Back,",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
            )
            Text(
                text = userName,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
        }
    }
}

@Composable
fun SummaryCard(stats: com.jja.campus.data.model.DashboardStats?, userRole: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        when (userRole.uppercase()) {
            "ADMIN" -> {
                StatCard("Students", stats?.totalStudents?.toString() ?: "-", Icons.Default.People, Modifier.weight(1f))
                StatCard("Teachers", stats?.totalTeachers?.toString() ?: "-", Icons.Default.School, Modifier.weight(1f))
                StatCard("Classes", stats?.totalClasses?.toString() ?: "-", Icons.Default.Class, Modifier.weight(1f))
            }
            "TEACHER", "CLASS_TEACHER" -> {
                StatCard("Students", stats?.totalStudents?.toString() ?: "-", Icons.Default.People, Modifier.weight(1f))
                StatCard("Present", stats?.attendanceToday?.present?.toString() ?: "-", Icons.Default.CheckCircle, Modifier.weight(1f))
                StatCard("Absent", stats?.attendanceToday?.absent?.toString() ?: "-", Icons.Default.Cancel, Modifier.weight(1f))
            }
            else -> {
                StatCard("Attendance", "${stats?.attendancePercentage?.toInt() ?: 0}%", Icons.Default.FactCheck, Modifier.weight(1f))
                StatCard("Homework", stats?.pendingHomework?.toString() ?: "0", Icons.Default.Assignment, Modifier.weight(1f))
                StatCard("Fee Balance", "₹${stats?.feeBalance?.toInt() ?: 0}", Icons.Default.AccountBalance, Modifier.weight(1f))
            }
        }
    }
}

@Composable
fun StatCard(title: String, value: String, icon: ImageVector, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = value, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = title, style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
fun QuickActionsRow(
    userRole: String,
    onAttendanceClick: () -> Unit,
    onHomeworkClick: () -> Unit,
    onFeesClick: () -> Unit,
    onResultsClick: () -> Unit
) {
    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            QuickActionCard("Attendance", Icons.Default.FactCheck, onAttendanceClick)
        }
        item {
            QuickActionCard("Homework", Icons.Default.Assignment, onHomeworkClick)
        }
        if (userRole.uppercase() in listOf("PARENT", "STUDENT")) {
            item {
                QuickActionCard("Fees", Icons.Default.Payment, onFeesClick)
            }
        }
        item {
            QuickActionCard("Results", Icons.Default.Grade, onResultsClick)
        }
    }
}

@Composable
fun QuickActionCard(title: String, icon: ImageVector, onClick: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Card(
            modifier = Modifier.size(80.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant
            )
        ) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Icon(imageVector = icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(text = title, style = MaterialTheme.typography.bodySmall)
    }
}
