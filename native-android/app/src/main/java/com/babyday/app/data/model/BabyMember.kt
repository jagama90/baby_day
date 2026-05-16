package com.babyday.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class BabyMember(
    @SerialName("baby_id") val babyId: String = "",
    @SerialName("user_id") val userId: String = "",
    val role: String = "",
    val babies: Baby? = null
) {
    val roleLabel: String get() = when (role) {
        "mom", "엄마" -> "엄마"
        "dad", "아빠" -> "아빠"
        else -> "보호자"
    }
}
