package com.babyday.app.domain

import com.babyday.app.data.model.BabyRecord
import com.babyday.app.util.DateUtils

data class PatternMessage(val text: String)

class ComputePatternMessagesUseCase {
    operator fun invoke(
        records: List<BabyRecord>,
        nowMillis: Long = System.currentTimeMillis()
    ): List<PatternMessage> {
        val messages = mutableListOf<PatternMessage>()
        val latestFeed = records
            .filter { it.type == "formula" || it.type == "breast" }
            .maxByOrNull { it.startTime }
        val latestDiaper = records
            .filter { it.type == "diaper" }
            .maxByOrNull { it.startTime }
        val ongoingSleep = records
            .filter { it.type == "sleep" && it.endTime == null }
            .maxByOrNull { it.startTime }

        latestFeed?.let {
            val elapsedMin = elapsedMinutes(nowMillis, it.startTime)
            if (elapsedMin >= 150) {
                messages += PatternMessage("마지막 수유 후 ${DateUtils.durLabel(elapsedMin)} 지났어요")
            }
        }

        latestDiaper?.let {
            val elapsedMin = elapsedMinutes(nowMillis, it.startTime)
            if (elapsedMin >= 180) {
                messages += PatternMessage("마지막 기저귀 후 ${DateUtils.durLabel(elapsedMin)} 지났어요")
            }
        }

        ongoingSleep?.let {
            val elapsedMin = elapsedMinutes(nowMillis, it.startTime)
            if (elapsedMin >= 180) {
                messages += PatternMessage("수면이 ${DateUtils.durLabel(elapsedMin)}째 진행 중이에요")
            }
        }

        return messages
    }

    private fun elapsedMinutes(nowMillis: Long, startTime: String): Int {
        return ((nowMillis - DateUtils.parseIso(startTime)) / 60000).toInt()
    }
}
