package com.babyday.app.util

import com.babyday.app.data.model.BabyRecord

object LogUtils {

    val EMOJI = mapOf(
        "sleep" to "😴",
        "formula" to "🍼",
        "breast" to "🤱",
        "diaper" to "💧",
        "growth" to "📏",
        "hospital" to "🏥",
        "bath" to "🛁"
    )

    val LABEL = mapOf(
        "sleep" to "수면",
        "formula" to "분유",
        "breast" to "모유",
        "diaper" to "기저귀",
        "growth" to "성장",
        "hospital" to "병원",
        "bath" to "목욕"
    )

    fun detail(r: BabyRecord): String {
        return when (r.type) {
            "sleep" -> {
                val tag = if (r.sleepKind == "nap") "낮잠" else "밤잠"
                if (r.endTime != null) "$tag · ${DateUtils.durLabel(DateUtils.durMin(r.startTime, r.endTime))}"
                else "$tag · 진행 중"
            }
            "formula" -> "${r.ml ?: 0}ml"
            "breast" -> buildList {
                r.leftMin?.let { if (it > 0) add("왼쪽 ${it}분") }
                r.rightMin?.let { if (it > 0) add("오른쪽 ${it}분") }
                val total = (r.leftMin ?: 0) + (r.rightMin ?: 0)
                if (total > 0) add("총 ${total}분")
            }.joinToString(" · ").ifEmpty { "모유" }
            "diaper" -> when (r.diaperKind) {
                "urine" -> "💧 소변"
                "stool" -> "💩 대변"
                "both" -> "💧💩 소변+대변"
                else -> "기저귀"
            }
            "growth" -> buildList {
                r.weight?.let { add("${it}kg") }
                r.height?.let { add("${it}cm") }
                r.head?.let { add("두위 ${it}cm") }
            }.joinToString(" · ").ifEmpty { "성장 기록" }
            "hospital" -> r.hospitalName ?: r.memo ?: "병원 방문"
            "bath" -> r.memo ?: "목욕"
            else -> ""
        }
    }

    fun diaperEmoji(kind: String?): String = when (kind) {
        "stool", "both" -> "💩"
        else -> "💧"
    }

    fun breastToFormulaMl(totalBreastMin: Int, babyBirthStr: String?): Int {
        val rawMl = totalBreastMin * 7.5
        val factor = if (babyBirthStr != null) {
            val days = DateUtils.daysSince(babyBirthStr)
            when {
                days <= 14 -> 0.95
                days <= 30 -> 0.90
                days <= 120 -> 0.85
                else -> 0.80
            }
        } else 0.85
        return (rawMl * factor).toInt()
    }
}
