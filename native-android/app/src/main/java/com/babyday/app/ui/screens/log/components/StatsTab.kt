package com.babyday.app.ui.screens.log.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.babyday.app.data.model.BabyRecord
import com.babyday.app.ui.theme.*
import com.babyday.app.util.DateUtils

@Composable
fun StatsTab(
    records: List<BabyRecord>,
    babyBirth: String?
) {
    var period by remember { mutableStateOf("day") }
    var offset by remember { mutableIntStateOf(0) }

    val (periodRecs, periodLabel) = getPeriodRecords(records, period, offset)

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 100.dp)
    ) {
        item {
            // Period selector + navigation
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row {
                    listOf("day" to "일", "week" to "주").forEach { (p, lbl) ->
                        FilterChip(
                            selected = period == p,
                            onClick = { period = p; offset = 0 },
                            label = { Text(lbl) },
                            modifier = Modifier.padding(end = 8.dp)
                        )
                    }
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = { offset-- }) {
                        Text("‹", fontSize = 22.sp, fontWeight = FontWeight.Bold)
                    }
                    Text(periodLabel, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    IconButton(onClick = { if (offset < 0) offset++ }) {
                        Text("›", fontSize = 22.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
            HorizontalDivider()
        }

        if (period == "day") {
            item { DailySummaryCard(periodRecs) }
            item { SleepStatsCard(periodRecs) }
            item { FormulaStatsCard(periodRecs) }
            item { BreastStatsCard(periodRecs) }
            item { DiaperStatsCard(periodRecs) }
            item { BathStatsCard(periodRecs) }
        } else {
            item { WeeklyBarChart(records = records, offset = offset) }
            item { WeeklyAggregateCard(periodRecs) }
        }
    }
}

@Composable
private fun DailySummaryCard(records: List<BabyRecord>) {
    val sleepMin = records.filter { it.type == "sleep" && it.endTime != null }
        .sumOf { DateUtils.durMin(it.startTime, it.endTime!!) }
    val formulaMl = records.filter { it.type == "formula" }.sumOf { it.ml ?: 0 }
    val feedCount = records.count { it.type == "breast" || it.type == "formula" }
    val diaperCount = records.count { it.type == "diaper" }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("오늘 요약", fontWeight = FontWeight.Bold, fontSize = 15.sp)
            Spacer(Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatItem("수면", if (sleepMin > 0) DateUtils.durLabel(sleepMin) else "-", SleepColor)
                StatItem("수유", if (feedCount > 0) "${feedCount}회\n${formulaMl}ml" else "-", FormulaColor)
                StatItem("기저귀", if (diaperCount > 0) "${diaperCount}회" else "-", DiaperColor)
            }
        }
    }
}

@Composable
private fun StatItem(label: String, value: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(label, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.5f))
        Text(value, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = color)
    }
}

@Composable
private fun SleepStatsCard(records: List<BabyRecord>) {
    val sleepRecs = records.filter { it.type == "sleep" && it.endTime != null }
    if (sleepRecs.isEmpty()) return
    val total = sleepRecs.sumOf { DateUtils.durMin(it.startTime, it.endTime!!) }
    val nap = sleepRecs.filter { it.sleepKind == "nap" }.sumOf { DateUtils.durMin(it.startTime, it.endTime!!) }
    val night = sleepRecs.filter { it.sleepKind == "night" }.sumOf { DateUtils.durMin(it.startTime, it.endTime!!) }

    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = Modifier.size(10.dp).background(SleepColor, RoundedCornerShape(50)))
                Spacer(Modifier.width(8.dp))
                Text("수면", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = SleepColor)
            }
            Spacer(Modifier.height(8.dp))
            Text("총 ${DateUtils.durLabel(total)}", fontSize = 16.sp, fontWeight = FontWeight.Black)
            if (nap > 0) Text("낮잠 ${DateUtils.durLabel(nap)}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.6f))
            if (night > 0) Text("밤잠 ${DateUtils.durLabel(night)}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.6f))
            Text("${sleepRecs.size}회", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.4f))
        }
    }
}

@Composable
private fun FormulaStatsCard(records: List<BabyRecord>) {
    val recs = records.filter { it.type == "formula" }
    if (recs.isEmpty()) return
    val total = recs.sumOf { it.ml ?: 0 }
    val avg = if (recs.isNotEmpty()) total / recs.size else 0

    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = Modifier.size(10.dp).background(FormulaColor, RoundedCornerShape(50)))
                Spacer(Modifier.width(8.dp))
                Text("분유", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = FormulaColor)
            }
            Spacer(Modifier.height(8.dp))
            Text("${total}ml", fontSize = 16.sp, fontWeight = FontWeight.Black)
            Text("${recs.size}회 · 평균 ${avg}ml", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.6f))
        }
    }
}

@Composable
private fun BreastStatsCard(records: List<BabyRecord>) {
    val recs = records.filter { it.type == "breast" }
    if (recs.isEmpty()) return
    val totalLeft = recs.sumOf { it.leftMin ?: 0 }
    val totalRight = recs.sumOf { it.rightMin ?: 0 }

    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = Modifier.size(10.dp).background(BreastColor, RoundedCornerShape(50)))
                Spacer(Modifier.width(8.dp))
                Text("모유", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = BreastColor)
            }
            Spacer(Modifier.height(8.dp))
            Text("총 ${totalLeft + totalRight}분", fontSize = 16.sp, fontWeight = FontWeight.Black)
            Text("왼쪽 ${totalLeft}분 · 오른쪽 ${totalRight}분", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.6f))
            Text("${recs.size}회", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.4f))
        }
    }
}

@Composable
private fun DiaperStatsCard(records: List<BabyRecord>) {
    val recs = records.filter { it.type == "diaper" }
    if (recs.isEmpty()) return
    val urine = recs.count { it.diaperKind == "urine" || it.diaperKind == null }
    val stool = recs.count { it.diaperKind == "stool" }
    val both = recs.count { it.diaperKind == "both" }

    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = Modifier.size(10.dp).background(DiaperColor, RoundedCornerShape(50)))
                Spacer(Modifier.width(8.dp))
                Text("기저귀", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = DiaperColor)
            }
            Spacer(Modifier.height(8.dp))
            Text("${recs.size}회", fontSize = 16.sp, fontWeight = FontWeight.Black)
            Text("소변 $urine · 대변 $stool · 둘다 $both", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.6f))
        }
    }
}

@Composable
private fun BathStatsCard(records: List<BabyRecord>) {
    val count = records.count { it.type == "bath" }
    if (count == 0) return
    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = Modifier.size(10.dp).background(BathColor, RoundedCornerShape(50)))
                Spacer(Modifier.width(8.dp))
                Text("목욕", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = BathColor)
            }
            Text("${count}회", fontSize = 16.sp, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun WeeklyBarChart(records: List<BabyRecord>, offset: Int) {
    val days = listOf("월", "화", "수", "목", "금", "토", "일")
    val cal = java.util.Calendar.getInstance()
    cal.add(java.util.Calendar.WEEK_OF_YEAR, offset)
    val dow = cal.get(java.util.Calendar.DAY_OF_WEEK)
    cal.add(java.util.Calendar.DAY_OF_MONTH, -(if (dow == 1) 6 else dow - 2))
    val dates = (0..6).map { i ->
        java.util.Calendar.getInstance().also { c ->
            c.time = cal.time
            c.add(java.util.Calendar.DAY_OF_MONTH, i)
        }.let { c -> DateUtils.fmtDate(c.time) }
    }

    val sleepByDay = dates.map { ds ->
        records.filter { it.date == ds && it.type == "sleep" && it.endTime != null }
            .sumOf { DateUtils.durMin(it.startTime, it.endTime!!) }.toFloat()
    }
    val formulaByDay = dates.map { ds ->
        records.filter { it.date == ds && it.type == "formula" }
            .sumOf { it.ml ?: 0 }.toFloat()
    }
    val maxSleep = sleepByDay.maxOrNull()?.takeIf { it > 0 } ?: 1f
    val maxFormula = formulaByDay.maxOrNull()?.takeIf { it > 0 } ?: 1f

    Card(
        modifier = Modifier.fillMaxWidth().padding(16.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("수면 (분)", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = SleepColor)
            Spacer(Modifier.height(4.dp))
            Canvas(modifier = Modifier.fillMaxWidth().height(80.dp)) {
                val barW = size.width / 7f * 0.6f
                val gap = size.width / 7f
                sleepByDay.forEachIndexed { i, v ->
                    val barH = (v / maxSleep) * size.height * 0.9f
                    val x = i * gap + gap * 0.2f
                    drawRect(
                        color = SleepColor.copy(alpha = 0.7f),
                        topLeft = Offset(x, size.height - barH),
                        size = androidx.compose.ui.geometry.Size(barW, barH)
                    )
                }
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                days.forEach { d -> Text(d, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.5f)) }
            }
            Spacer(Modifier.height(12.dp))
            Text("분유 (ml)", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = FormulaColor)
            Spacer(Modifier.height(4.dp))
            Canvas(modifier = Modifier.fillMaxWidth().height(80.dp)) {
                val barW = size.width / 7f * 0.6f
                val gap = size.width / 7f
                formulaByDay.forEachIndexed { i, v ->
                    val barH = (v / maxFormula) * size.height * 0.9f
                    val x = i * gap + gap * 0.2f
                    drawRect(
                        color = FormulaColor.copy(alpha = 0.7f),
                        topLeft = Offset(x, size.height - barH),
                        size = androidx.compose.ui.geometry.Size(barW, barH)
                    )
                }
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                days.forEach { d -> Text(d, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.5f)) }
            }
        }
    }
}

@Composable
private fun WeeklyAggregateCard(records: List<BabyRecord>) {
    val sleepMin = records.filter { it.type == "sleep" && it.endTime != null }
        .sumOf { DateUtils.durMin(it.startTime, it.endTime!!) }
    val formulaMl = records.filter { it.type == "formula" }.sumOf { it.ml ?: 0 }
    val feedCount = records.count { it.type == "breast" || it.type == "formula" }
    val diaperCount = records.count { it.type == "diaper" }

    Card(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("주간 집계", fontWeight = FontWeight.Bold, fontSize = 15.sp)
            Spacer(Modifier.height(10.dp))
            if (sleepMin > 0) Text("😴 총 수면: ${DateUtils.durLabel(sleepMin)}", fontSize = 13.sp)
            if (formulaMl > 0) Text("🍼 총 분유: ${formulaMl}ml (${feedCount}회)", fontSize = 13.sp)
            if (diaperCount > 0) Text("💧 기저귀: ${diaperCount}회", fontSize = 13.sp)
        }
    }
}

fun getPeriodRecords(
    records: List<BabyRecord>,
    period: String,
    offset: Int
): Pair<List<BabyRecord>, String> {
    val cal = java.util.Calendar.getInstance()
    return if (period == "day") {
        cal.add(java.util.Calendar.DAY_OF_MONTH, offset)
        val ds = DateUtils.fmtDate(cal.time)
        val label = "${cal.get(java.util.Calendar.MONTH) + 1}월 ${cal.get(java.util.Calendar.DAY_OF_MONTH)}일"
        records.filter { it.date == ds } to label
    } else {
        cal.add(java.util.Calendar.WEEK_OF_YEAR, offset)
        val dow = cal.get(java.util.Calendar.DAY_OF_WEEK)
        cal.add(java.util.Calendar.DAY_OF_MONTH, -(if (dow == 1) 6 else dow - 2))
        val dates = (0..6).map { i ->
            java.util.Calendar.getInstance().also { c ->
                c.time = cal.time
                c.add(java.util.Calendar.DAY_OF_MONTH, i)
            }.let { c -> DateUtils.fmtDate(c.time) }
        }
        val mon = dates.first(); val sun = dates.last()
        val monCal = java.util.Calendar.getInstance().also { c ->
            c.time = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).parse(mon)!!
        }
        val sunCal = java.util.Calendar.getInstance().also { c ->
            c.time = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).parse(sun)!!
        }
        val label = "${monCal.get(java.util.Calendar.MONTH) + 1}월 ${monCal.get(java.util.Calendar.DAY_OF_MONTH)}일 ~ " +
                "${sunCal.get(java.util.Calendar.MONTH) + 1}월 ${sunCal.get(java.util.Calendar.DAY_OF_MONTH)}일"
        records.filter { it.date in dates } to label
    }
}
