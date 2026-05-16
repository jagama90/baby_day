package com.babyday.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class BabyRecord(
    val id: String = "",
    val type: String = "",
    val date: String = "",
    @SerialName("start_time") val startTime: String = "",
    @SerialName("end_time") val endTime: String? = null,
    val ml: Int? = null,
    @SerialName("left_min") val leftMin: Int? = null,
    @SerialName("right_min") val rightMin: Int? = null,
    @SerialName("sleep_kind") val sleepKind: String? = null,
    @SerialName("diaper_kind") val diaperKind: String? = null,
    val weight: Double? = null,
    val height: Double? = null,
    val head: Double? = null,
    @SerialName("hospital_name") val hospitalName: String? = null,
    @SerialName("hospital_type") val hospitalType: String? = null,
    @SerialName("vaccine_name") val vaccineName: String? = null,
    val memo: String? = null,
    @SerialName("user_id") val userId: String? = null,
    @SerialName("baby_id") val babyId: String? = null,
    @SerialName("created_at") val createdAt: String? = null
)
