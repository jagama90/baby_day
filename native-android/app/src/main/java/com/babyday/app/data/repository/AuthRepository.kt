package com.babyday.app.data.repository

import android.content.Context
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import com.babyday.app.data.remote.SupabaseClientProvider
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.Google
import io.github.jan.supabase.auth.providers.Kakao
import io.github.jan.supabase.auth.user.UserInfo

class AuthRepository {

    private val auth get() = SupabaseClientProvider.client.auth

    fun signInWithGoogle(context: Context) {
        val url = auth.getOAuthUrl(Google, "babyday://auth/callback")
        CustomTabsIntent.Builder()
            .setShowTitle(false)
            .build()
            .launchUrl(context, Uri.parse(url))
    }

    fun signInWithKakao(context: Context) {
        val url = auth.getOAuthUrl(Kakao, "babyday://auth/callback")
        CustomTabsIntent.Builder()
            .setShowTitle(false)
            .build()
            .launchUrl(context, Uri.parse(url))
    }

    suspend fun getCurrentUser(): UserInfo? = runCatching {
        auth.retrieveUserForCurrentSession(updateSession = true)
    }.getOrNull()

    fun isSessionActive(): Boolean = auth.currentSessionOrNull() != null

    suspend fun signOut() = auth.signOut()
}
