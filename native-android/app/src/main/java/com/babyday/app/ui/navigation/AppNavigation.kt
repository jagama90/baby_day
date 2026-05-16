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
import kotlinx.coroutines.flow.filterIsInstance
import kotlinx.coroutines.flow.first

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    val auth = SupabaseClientProvider.client.auth
    val sessionStatus by auth.sessionStatus.collectAsStateWithLifecycle(
        initialValue = SessionStatus.Initializing
    )

    val startDestination = when (sessionStatus) {
        is SessionStatus.Authenticated -> NavRoutes.Log.route
        else -> NavRoutes.Login.route
    }

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

    // React to auth state changes for auto-redirect
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
