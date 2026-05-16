package com.babyday.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Baby(
    val id: String = "",
    val name: String = "",
    @SerialName("birth_date") val birthDate: String? = null,
    val gender: String? = null,
    @SerialName("photo_url") val photoUrl: String? = null,
    @SerialName("due_date") val dueDate: String? = null,
    @SerialName("birth_weight") val birthWeight: Double? = null,
    @SerialName("birth_height") val birthHeight: Double? = null,
    @SerialName("birth_head") val birthHead: Double? = null,
    @SerialName("feeding_type") val feedingType: String? = null,
    @SerialName("blood_type") val bloodType: String? = null,
    @SerialName("birth_hospital") val birthHospital: String? = null
)
