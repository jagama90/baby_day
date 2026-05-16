package com.babyday.app.util

import com.babyday.app.data.local.db.BabyRecordEntity
import com.babyday.app.data.model.BabyRecord

fun BabyRecord.toEntity() = BabyRecordEntity(
    id, type, date, startTime, endTime, ml, leftMin, rightMin,
    sleepKind, diaperKind, weight, height, head,
    hospitalName, hospitalType, vaccineName, memo, userId, babyId
)

fun BabyRecordEntity.toModel() = BabyRecord(
    id, type, date, startTime, endTime, ml, leftMin, rightMin,
    sleepKind, diaperKind, weight, height, head,
    hospitalName, hospitalType, vaccineName, memo, userId, babyId
)
