package com.babyday.app.data.local.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "baby_records")
data class BabyRecordEntity(
    @PrimaryKey val id: String,
    val type: String,
    val date: String,
    val startTime: String,
    val endTime: String?,
    val ml: Int?,
    val leftMin: Int?,
    val rightMin: Int?,
    val sleepKind: String?,
    val diaperKind: String?,
    val weight: Double?,
    val height: Double?,
    val head: Double?,
    val hospitalName: String?,
    val hospitalType: String?,
    val vaccineName: String?,
    val memo: String?,
    val userId: String?,
    val babyId: String?
)
