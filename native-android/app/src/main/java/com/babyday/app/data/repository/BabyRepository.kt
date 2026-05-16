package com.babyday.app.data.repository

import com.babyday.app.data.model.Baby
import com.babyday.app.data.model.BabyMember
import com.babyday.app.data.remote.SupabaseClientProvider
import io.github.jan.supabase.postgrest.from
import java.time.OffsetDateTime
import java.time.ZoneId

class BabyRepository {

    private val client get() = SupabaseClientProvider.client
    private val userRepository = UserRepository()

    suspend fun getBabiesForUser(userId: String): List<BabyMember> {
        val all = client.from("baby_members")
            .select(
                columns = io.github.jan.supabase.postgrest.query.Columns.raw(
                    "baby_id, user_id, role, babies(id, name, birth_date, gender, photo_url, due_date, birth_weight, birth_height, birth_head, feeding_type, blood_type, birth_hospital)"
                )
            ) {
                filter { eq("user_id", userId) }
            }
            .decodeList<BabyMember>()

        // Deduplicate by baby_id
        return all.distinctBy { it.babyId }
    }

    suspend fun createBaby(name: String, birthDate: String, gender: String, userId: String): Baby {
        userRepository.ensureCurrentUserProfile()
        val baby = client.from("babies").insert(
            mapOf("name" to name, "birth_date" to birthDate, "gender" to gender, "created_by" to userId)
        ).decodeSingle<Baby>()
        client.from("baby_members").insert(
            mapOf("baby_id" to baby.id, "user_id" to userId, "role" to "parent")
        )
        return baby
    }

    suspend fun updateBaby(babyId: String, fields: Map<String, Any?>) {
        client.from("babies").update(fields) { filter { eq("id", babyId) } }
    }

    suspend fun deleteBaby(babyId: String, userId: String) {
        val membership = client.from("baby_members").select {
            filter {
                eq("baby_id", babyId)
                eq("user_id", userId)
            }
        }.decodeList<Map<String, String>>()
        require(membership.isNotEmpty()) { "No permission to delete this baby" }

        client.from("babies").delete {
            filter { eq("id", babyId) }
        }
    }

    suspend fun generateInviteCode(babyId: String, userId: String): String {
        val membership = client.from("baby_members").select {
            filter {
                eq("baby_id", babyId)
                eq("user_id", userId)
            }
        }.decodeList<Map<String, String>>()
        require(membership.isNotEmpty()) { "No permission to invite members" }

        repeat(5) {
            val code = (1..6).map { ('A'..'Z').random() }.joinToString("")
            val expires = OffsetDateTime.now(ZoneId.systemDefault()).plusHours(24).toString()
            val inserted = runCatching {
                client.from("invite_codes").insert(
                    mapOf("code" to code, "baby_id" to babyId, "created_by" to userId, "expires_at" to expires)
                )
            }.isSuccess
            if (inserted) return code
        }
        error("Failed to generate a unique invite code")
    }

    suspend fun joinByInviteCode(code: String, userId: String): Boolean {
        val now = OffsetDateTime.now(ZoneId.systemDefault()).toString()
        val invite = runCatching {
            client.from("invite_codes").select { filter { eq("code", code) } }
                .decodeSingleOrNull<Map<String, String>>()
        }.getOrNull() ?: return false
        val expiresAt = invite["expires_at"] ?: return false
        if (runCatching { OffsetDateTime.parse(expiresAt) <= OffsetDateTime.parse(now) }.getOrDefault(true)) {
            return false
        }
        val babyId = invite["baby_id"] ?: return false
        val existing = runCatching {
            client.from("baby_members").select {
                filter { eq("baby_id", babyId); eq("user_id", userId) }
            }.decodeList<Map<String, String>>()
        }.getOrNull()
        if (!existing.isNullOrEmpty()) return true
        client.from("baby_members").insert(
            mapOf("baby_id" to babyId, "user_id" to userId, "role" to "parent")
        )
        return true
    }
}
