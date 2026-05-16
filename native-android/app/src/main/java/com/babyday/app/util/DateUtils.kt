package com.babyday.app.util

import java.text.SimpleDateFormat
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.time.ZoneId
import java.util.Date
import java.util.Locale

object DateUtils {

    private val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    private val timeFmt = SimpleDateFormat("HH:mm", Locale.getDefault())

    fun todayStr(): String = sdf.format(Date())
    fun fmtDate(date: Date): String = sdf.format(date)
    fun fmtTime(isoStr: String): String = runCatching {
        timeFmt.format(Date(parseIso(isoStr)))
    }.getOrDefault("--:--")

    fun parseIso(iso: String): Long = runCatching {
        OffsetDateTime.parse(iso).toInstant().toEpochMilli()
    }.recoverCatching {
        LocalDateTime.parse(iso)
            .atZone(ZoneId.systemDefault())
            .toInstant()
            .toEpochMilli()
    }.getOrDefault(0L)

    fun elapsed(isoStr: String): String {
        val m = ((System.currentTimeMillis() - parseIso(isoStr)) / 60000).toInt()
        if (m < 1) return "방금 전"
        if (m < 60) return "${m}분 전"
        val h = m / 60; val rm = m % 60
        return "${h}시간${if (rm > 0) " ${rm}분" else ""} 전"
    }

    fun durMin(start: String, end: String): Int {
        return ((parseIso(end) - parseIso(start)) / 60000).toInt()
    }

    fun durLabel(minutes: Int): String {
        if (minutes <= 0) return "0분"
        return if (minutes < 60) "${minutes}분"
        else "${minutes / 60}시간${if (minutes % 60 > 0) " ${minutes % 60}분" else ""}"
    }

    fun toAmPm(hhmm: String): String {
        val parts = hhmm.split(":").map { it.toIntOrNull() ?: 0 }
        val h = parts[0]; val m = parts.getOrElse(1) { 0 }
        val ampm = if (h < 12) "오전" else "오후"
        val dh = if (h % 12 == 0) 12 else h % 12
        return "$ampm $dh:${m.toString().padStart(2, '0')}"
    }

    fun daysSince(birthDateStr: String): Int = runCatching {
        val birth = sdf.parse(birthDateStr) ?: return 0
        ((System.currentTimeMillis() - birth.time) / 86400000L).toInt()
    }.getOrDefault(0)
}
