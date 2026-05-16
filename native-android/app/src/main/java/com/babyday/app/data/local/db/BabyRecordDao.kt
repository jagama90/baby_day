package com.babyday.app.data.local.db

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface BabyRecordDao {
    @Query("SELECT * FROM baby_records WHERE babyId = :babyId ORDER BY startTime DESC")
    fun getRecordsFlow(babyId: String): Flow<List<BabyRecordEntity>>

    @Query("SELECT * FROM baby_records WHERE babyId = :babyId ORDER BY startTime DESC")
    suspend fun getRecords(babyId: String): List<BabyRecordEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(records: List<BabyRecordEntity>)

    @Delete
    suspend fun delete(record: BabyRecordEntity)

    @Query("DELETE FROM baby_records WHERE babyId = :babyId")
    suspend fun deleteAll(babyId: String)
}
