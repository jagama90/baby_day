package com.babyday.app.data.repository

import com.babyday.app.data.remote.SupabaseClientProvider
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.Google
import io.github.jan.supabase.auth.providers.Kakao
import io.github.jan.supabase.auth.user.UserInfo

class AuthRepository {

    private val auth get() = SupabaseClientProvider.client.auth

    suspend fun signInWithGoogle() {
        auth.signInWith(Google, SupabaseClientProvider.AUTH_REDIRECT_URL)
    }

    suspend fun signInWithKakao() {
        auth.signInWith(Kakao, SupabaseClientProvider.AUTH_REDIRECT_URL)
    }

    suspend fun getCurrentUser(): UserInfo? = runCatching {
        auth.retrieveUserForCurrentSession(updateSession = true)
    }.getOrNull()

    fun isSessionActive(): Boolean = auth.currentSessionOrNull() != null

    suspend fun signOut() = auth.signOut()
}
