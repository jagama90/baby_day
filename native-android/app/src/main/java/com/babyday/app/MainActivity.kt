package com.babyday.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.lifecycleScope
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
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
        if (SupabaseClientProvider.isConfigured) {
            handleIncomingIntent(intent)
        }
        setContent {
            val darkMode by AppState.darkMode.collectAsStateWithLifecycle(initialValue = false)
            BabyDayTheme(darkTheme = darkMode) {
                val configError = SupabaseClientProvider.configurationError
                if (configError == null) {
                    AppNavigation()
                } else {
                    ConfigurationErrorScreen(configError)
                }
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
        if (uri.scheme == "babyday" && SupabaseClientProvider.isConfigured) {
            lifecycleScope.launch {
                SupabaseClientProvider.client.handleDeeplinks(intent)
            }
        }
    }
}

@androidx.compose.runtime.Composable
private fun ConfigurationErrorScreen(message: String) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "앱 설정 오류",
            style = MaterialTheme.typography.titleLarge
        )
        Text(
            text = message,
            modifier = Modifier.padding(top = 12.dp),
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center
        )
    }
}
