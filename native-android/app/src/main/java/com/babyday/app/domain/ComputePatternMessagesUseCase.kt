package com.babyday.app.domain

import com.babyday.app.data.model.BabyRecord
import com.babyday.app.util.DateUtils

data class PatternMessage(val text: String, val isWarning: Boolean = false)

class ComputePatternMessagesUseCase {
    operator fun invoke(
        records: List<BabyRecord>,
        nowMillis: Long = System.currentTimeMillis()
    ): List<PatternMessage> {
        val messages = mutableListOf<PatternMessage>()

        val allFeeds = records
            .filter { it.type == "formula" || it.type == "breast" }
            .sortedBy { it.startTime }
        val latestFeed    = allFeeds.lastOrNull()
        val latestDiaper  = records.filter { it.type == "diaper" }.maxByOrNull { it.startTime }
        val ongoingSleep  = records.filter { it.type == "sleep" && it.endTime == null }.maxByOrNull { it.startTime }

        // 14-day median feed interval → predict next feed
        val cutoff14 = nowMillis - 14L * 24 * 60 * 60 * 1000
        val recentFeeds = allFeeds.filter { DateUtils.parseIso(it.startTime) >= cutoff14 }
        val intervals = recentFeeds.zipWithNext().map { (a, b) ->
            (DateUtils.parseIso(b.startTime) - DateUtils.parseIso(a.startTime)) / 60000L
        }.filter { it in 30L..480L }

        if (intervals.size >= 2) {
            val sorted = intervals.sorted()
            val median = if (sorted.size % 2 == 0)
                (sorted[sorted.size / 2 - 1] + sorted[sorted.size / 2]) / 2L
            else
                sorted[sorted.size / 2]
            latestFeed?.let { feed ->
                val nextMs = DateUtils.parseIso(feed.startTime) + median * 60000L
                val minsUntil = ((nextMs - nowMillis) / 60000L).toInt()
                when {
                    minsUntil <= -30 -> messages += PatternMessage(
                        "⚠️ 수유 예정 시간을 ${DateUtils.durLabel(-minsUntil)} 지났어요",
                        isWarning = true
                    )
                    minsUntil in -29..15 -> messages += PatternMessage(
                        "🍼 수유 시간이에요 (평균 간격 ${DateUtils.durLabel(median.toInt())})",
                        isWarning = minsUntil < 0
                    )
                }
            }
        } else {
            latestFeed?.let {
                val elapsedMin = elapsedMinutes(nowMillis, it.startTime)
                if (elapsedMin >= 180) {
                    messages += PatternMessage(
                        "⚠️ 마지막 수유 후 ${DateUtils.durLabel(elapsedMin)} 지났어요",
                        isWarning = true
                    )
                }
            }
        }

        latestDiaper?.let {
            val elapsedMin = elapsedMinutes(nowMillis, it.startTime)
            if (elapsedMin >= 180) {
                messages += PatternMessage("💧 마지막 기저귀 후 ${DateUtils.durLabel(elapsedMin)} 지났어요")
            }
        }

        ongoingSleep?.let {
            val elapsedMin = elapsedMinutes(nowMillis, it.startTime)
            if (elapsedMin >= 180) {
                messages += PatternMessage("😴 수면이 ${DateUtils.durLabel(elapsedMin)}째 진행 중이에요")
            }
        }

        return messages
    }

    private fun elapsedMinutes(nowMillis: Long, startTime: String): Int {
        return ((nowMillis - DateUtils.parseIso(startTime)) / 60000).toInt()
    }
}
