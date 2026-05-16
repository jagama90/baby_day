package com.babyday.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.lifecycleScope
import androidx.compose.runtime.getValue
import com.babyday.app.data.remote.SupabaseClientProvider
import com.babyday.app.ui.AppState
import com.babyday.app.ui.navigation.AppNavigation
import com.babyday.app.ui.theme.BabyDayTheme
import io.github.jan.supabase.auth.handleDeeplinks
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        handleIncomingIntent(intent)
        setContent {
            val darkMode by AppState.darkMode.collectAsStateWithLifecycle(initialValue = false)
            BabyDayTheme(darkTheme = darkMode) {
                AppNavigation()
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIncomingIntent(intent)
    }

    private fun handleIncomingIntent(intent: Intent?) {
        val uri = intent?.data ?: return
        if (uri.scheme == "babyday") {
            lifecycleScope.launch {
                SupabaseClientProvider.client.handleDeeplinks(intent)
            }
        }
    }
}
