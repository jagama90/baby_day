package com.babyday.app.data.repository

import com.babyday.app.BabyDayApp
import com.babyday.app.data.local.db.BabyDayDatabase
import com.babyday.app.data.model.BabyRecord
import com.babyday.app.data.remote.SupabaseClientProvider
import com.babyday.app.util.toEntity
import com.babyday.app.util.toModel
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Order

class LogRepository {

    private val client get() = SupabaseClientProvider.client

    suspend fun getLogs(babyId: String): List<BabyRecord> {
        return try {
            val fresh = client.from("baby_logs")
                .select {
                    filter { eq("baby_id", babyId) }
                    order("start_time", Order.DESCENDING)
                }
                .decodeList<BabyRecord>()
            // Cache to Room
            val dao = BabyDayDatabase.getInstance(BabyDayApp.instance).babyRecordDao()
            dao.deleteAll(babyId)
            dao.insertAll(fresh.map { it.toEntity() })
            fresh
        } catch (e: Exception) {
            // Fallback to cache
            val dao = BabyDayDatabase.getInstance(BabyDayApp.instance).babyRecordDao()
            dao.getRecords(babyId).map { it.toModel() }
        }
    }

    suspend fun createLog(record: Map<String, Any?>): BabyRecord {
        return client.from("baby_logs").insert(record).decodeSingle()
    }

    suspend fun deleteLog(id: String) {
        client.from("baby_logs").delete { filter { eq("id", id) } }
    }

    suspend fun updateLog(id: String, patch: Map<String, Any?>): BabyRecord {
        return client.from("baby_logs").update(patch) { filter { eq("id", id) } }.decodeSingle()
    }
}
