package com.babyday.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.babyday.app.data.remote.SupabaseClientProvider
import com.babyday.app.ui.screens.log.LogScreen
import com.babyday.app.ui.screens.login.LoginScreen
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.status.SessionStatus

@Composable
fun AppNavigation() {
    val auth = SupabaseClientProvider.client.auth
    val sessionStatus by auth.sessionStatus.collectAsStateWithLifecycle(
        initialValue = SessionStatus.Initializing
    )

    // 세션 확인 중에는 아무것도 렌더하지 않음 (스플래시 스크린이 유지됨)
    if (sessionStatus is SessionStatus.Initializing) return

    val navController = rememberNavController()
    val startDestination = if (sessionStatus is SessionStatus.Authenticated)
        NavRoutes.Log.route else NavRoutes.Login.route

    NavHost(navController = navController, startDestination = startDestination) {
        composable(NavRoutes.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(NavRoutes.Log.route) {
                        popUpTo(NavRoutes.Login.route) { inclusive = true }
                    }
                }
            )
        }
        composable(
            route = NavRoutes.Log.route,
            arguments = listOf(navArgument(NavRoutes.Log.ARG) {
                type = NavType.StringType
                nullable = true
                defaultValue = null
            })
        ) { backStack ->
            val babyId = backStack.arguments?.getString(NavRoutes.Log.ARG)
            LogScreen(
                initialBabyId = babyId,
                onLogout = {
                    navController.navigate(NavRoutes.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
    }

    // 로그아웃 등 런타임 auth 변경에 대응
    LaunchedEffect(sessionStatus) {
        when (sessionStatus) {
            is SessionStatus.Authenticated -> {
                if (navController.currentDestination?.route == NavRoutes.Login.route) {
                    navController.navigate(NavRoutes.Log.route) {
                        popUpTo(NavRoutes.Login.route) { inclusive = true }
                    }
                }
            }
            is SessionStatus.NotAuthenticated -> {
                if (navController.currentDestination?.route != NavRoutes.Login.route) {
                    navController.navigate(NavRoutes.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            }
            else -> {}
        }
    }
}
