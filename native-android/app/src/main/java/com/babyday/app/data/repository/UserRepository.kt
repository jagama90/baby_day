package com.babyday.app.data.repository

import com.babyday.app.data.remote.SupabaseClientProvider
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.user.UserInfo
import io.github.jan.supabase.postgrest.from
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive

class UserRepository {

    private val client get() = SupabaseClientProvider.client

    suspend fun ensureCurrentUserProfile(): UserInfo? {
        val user = client.auth.currentUserOrNull()
            ?: runCatching { client.auth.retrieveUserForCurrentSession(updateSession = true) }.getOrNull()
            ?: return null

        val existing = runCatching {
            client.from("users").select {
                filter { eq("id", user.id) }
                limit(1)
            }.decodeList<Map<String, String>>()
        }.getOrNull()

        if (!existing.isNullOrEmpty()) return user

        val provider = user.appMetadata
            ?.get("provider")
            ?.jsonPrimitive
            ?.contentOrNull
        val nickname = user.userMetadata
            ?.get("name")
            ?.jsonPrimitive
            ?.contentOrNull
            ?: user.userMetadata
                ?.get("full_name")
                ?.jsonPrimitive
                ?.contentOrNull

        runCatching {
            client.from("users").insert(
                mapOf(
                    "id" to user.id,
                    "email" to user.email,
                    "provider" to provider,
                    "nickname" to nickname
                )
            )
        }

        return user
    }
}
