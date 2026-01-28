package com.jja.campus.ui.navigation

import androidx.compose.animation.ExperimentalAnimationApi
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.navArgument
import com.google.accompanist.navigation.animation.AnimatedNavHost
import com.google.accompanist.navigation.animation.composable
import com.google.accompanist.navigation.animation.rememberAnimatedNavController
import com.jja.campus.ui.screens.approvals.ApprovalsScreen
import com.jja.campus.ui.screens.auth.*
import com.jja.campus.ui.screens.classes.ClassesScreen
import com.jja.campus.ui.screens.dashboard.DashboardScreen
import com.jja.campus.ui.screens.attendance.AttendanceScreen
import com.jja.campus.ui.screens.homework.HomeworkScreen
import com.jja.campus.ui.screens.homework.HomeworkDetailScreen
import com.jja.campus.ui.screens.fees.FeesScreen
import com.jja.campus.ui.screens.results.ResultsScreen
import com.jja.campus.ui.screens.notifications.NotificationsScreen
import com.jja.campus.ui.screens.profile.ProfileScreen

@OptIn(ExperimentalAnimationApi::class)
@Composable
fun JJANavHost(
    authViewModel: AuthViewModel = hiltViewModel()
) {
    val navController = rememberAnimatedNavController()
    val isLoggedIn by authViewModel.isLoggedIn.collectAsState(initial = false)
    val userRole by authViewModel.userRole.collectAsState(initial = null)

    val startDestination = if (isLoggedIn) NavRoutes.Dashboard.route else NavRoutes.Login.route

    // Routes that don't show bottom nav
    val authRoutes = listOf(
        NavRoutes.Login.route,
        NavRoutes.Register.route,
        NavRoutes.ForgotPassword.route,
        NavRoutes.Splash.route
    )

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val showBottomBar = currentRoute !in authRoutes && isLoggedIn

    Scaffold(
        bottomBar = {
            if (showBottomBar && userRole != null) {
                JJABottomNavBar(
                    navController = navController,
                    userRole = userRole!!
                )
            }
        }
    ) { paddingValues ->
        AnimatedNavHost(
            navController = navController,
            startDestination = startDestination,
            modifier = Modifier.padding(paddingValues),
            enterTransition = { fadeIn(animationSpec = tween(300)) + slideInHorizontally(initialOffsetX = { 1000 }) },
            exitTransition = { fadeOut(animationSpec = tween(300)) + slideOutHorizontally(targetOffsetX = { -1000 }) },
            popEnterTransition = { fadeIn(animationSpec = tween(300)) + slideInHorizontally(initialOffsetX = { -1000 }) },
            popExitTransition = { fadeOut(animationSpec = tween(300)) + slideOutHorizontally(targetOffsetX = { 1000 }) }
        ) {
            // Auth routes
            composable(NavRoutes.Login.route) {
                LoginScreen(
                    onNavigateToRegister = {
                        navController.navigate(NavRoutes.Register.route)
                    },
                    onNavigateToForgotPassword = {
                        navController.navigate(NavRoutes.ForgotPassword.route)
                    },
                    onLoginSuccess = {
                        navController.navigate(NavRoutes.Dashboard.route) {
                            popUpTo(NavRoutes.Login.route) { inclusive = true }
                        }
                    }
                )
            }

            composable(NavRoutes.Register.route) {
                RegisterScreen(
                    onNavigateToLogin = {
                        navController.popBackStack()
                    },
                    onRegisterSuccess = {
                        navController.navigate(NavRoutes.Login.route) {
                            popUpTo(NavRoutes.Register.route) { inclusive = true }
                        }
                    }
                )
            }

            composable(NavRoutes.ForgotPassword.route) {
                ForgotPasswordScreen(
                    onNavigateBack = {
                        navController.popBackStack()
                    },
                    onResetSuccess = {
                        navController.navigate(NavRoutes.Login.route) {
                            popUpTo(NavRoutes.ForgotPassword.route) { inclusive = true }
                        }
                    }
                )
            }

            // Main routes
            composable(NavRoutes.Dashboard.route) {
                DashboardScreen(
                    onNavigateToAttendance = { navController.navigate(NavRoutes.Attendance.route) },
                    onNavigateToHomework = { navController.navigate(NavRoutes.Homework.route) },
                    onNavigateToFees = { navController.navigate(NavRoutes.Fees.route) },
                    onNavigateToResults = { navController.navigate(NavRoutes.Results.route) }
                )
            }

            composable(NavRoutes.Attendance.route) {
                AttendanceScreen()
            }

            composable(NavRoutes.Homework.route) {
                HomeworkScreen(
                    onHomeworkClick = { homeworkId ->
                        navController.navigate(NavRoutes.HomeworkDetail.createRoute(homeworkId))
                    }
                )
            }

            composable(
                route = NavRoutes.HomeworkDetail.route,
                arguments = listOf(navArgument("homeworkId") { type = NavType.IntType })
            ) { backStackEntry ->
                val homeworkId = backStackEntry.arguments?.getInt("homeworkId") ?: return@composable
                HomeworkDetailScreen(
                    homeworkId = homeworkId,
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(NavRoutes.Fees.route) {
                FeesScreen()
            }

            composable(NavRoutes.Results.route) {
                ResultsScreen()
            }

            composable(NavRoutes.Notifications.route) {
                NotificationsScreen()
            }

            composable(NavRoutes.Profile.route) {
                ProfileScreen(
                    onLogout = {
                        authViewModel.logout()
                        navController.navigate(NavRoutes.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }

            composable(NavRoutes.ManageClasses.route) {
                ClassesScreen()
            }

            composable(NavRoutes.Approvals.route) {
                ApprovalsScreen()
            }
        }
    }
}

@Composable
fun JJABottomNavBar(
    navController: NavHostController,
    userRole: String
) {
    val items = BottomNavItem.getItemsForRole(userRole)
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    NavigationBar {
        items.forEach { item ->
            val selected = currentDestination?.hierarchy?.any { navDestination -> navDestination.route == item.route } == true

            NavigationBarItem(
                icon = {
                    Icon(
                        imageVector = getIconForNavItem(item, selected),
                        contentDescription = item.title
                    )
                },
                label = { Text(item.title) },
                selected = selected,
                onClick = {
                    navController.navigate(item.route) {
                        popUpTo(navController.graph.findStartDestination().id) {
                            saveState = true
                        }
                        launchSingleTop = true
                        restoreState = true
                    }
                }
            )
        }
    }
}

@Composable
fun getIconForNavItem(item: BottomNavItem, selected: Boolean): ImageVector {
    return when (item) {
        BottomNavItem.DASHBOARD -> if (selected) Icons.Filled.Home else Icons.Outlined.Home
        BottomNavItem.NOTIFICATIONS -> if (selected) Icons.Filled.Notifications else Icons.Outlined.Notifications
        BottomNavItem.PROFILE -> if (selected) Icons.Filled.Person else Icons.Outlined.Person
        BottomNavItem.ATTENDANCE -> if (selected) Icons.Filled.FactCheck else Icons.Outlined.FactCheck
        BottomNavItem.HOMEWORK -> if (selected) Icons.Filled.Assignment else Icons.Outlined.Assignment
        BottomNavItem.FEES -> if (selected) Icons.Filled.Payment else Icons.Outlined.Payment
        BottomNavItem.RESULTS -> if (selected) Icons.Filled.Grade else Icons.Outlined.Grade
        BottomNavItem.MARK_ATTENDANCE -> if (selected) Icons.Filled.HowToReg else Icons.Outlined.HowToReg
        BottomNavItem.MY_CLASSES -> if (selected) Icons.Filled.Groups else Icons.Outlined.Groups
        BottomNavItem.MANAGE -> if (selected) Icons.Filled.AdminPanelSettings else Icons.Outlined.AdminPanelSettings
        BottomNavItem.APPROVALS -> if (selected) Icons.Filled.Approval else Icons.Outlined.Approval
    }
}
