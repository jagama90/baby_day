package com.babyday.app.ui.navigation

sealed class NavRoutes(val route: String) {
    object Login : NavRoutes("login")
    object Log   : NavRoutes("log?babyId={babyId}") {
        fun withBaby(babyId: String) = "log?babyId=$babyId"
        const val ARG = "babyId"
    }
}
