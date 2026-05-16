package com.babyday.app.ui.screens.log.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.babyday.app.data.model.BabyRecord
import com.babyday.app.ui.theme.GrowthBg
import com.babyday.app.ui.theme.GrowthColor

@Composable
fun GrowthTab(
    records: List<BabyRecord>,
    onOpenAddSheet: (type: String) -> Unit,
    onDeleteRecord: (String) -> Unit
) {
    val growthRecs = records.filter { it.type == "growth" }.sortedByDescending { it.date }
    val weightPts = growthRecs.mapNotNull { r -> r.weight?.let { r.date to it } }.sortedBy { it.first }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 100.dp)
    ) {
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("성장 기록", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Button(
                    onClick = { onOpenAddSheet("growth") },
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("+ 성장 기록 추가")
                }
            }
        }

        if (weightPts.size >= 2) {
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("체중 변화 (kg)", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = GrowthColor)
                        Spacer(Modifier.height(8.dp))
                        val pts = weightPts
                        Canvas(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(140.dp)
                                .padding(horizontal = 8.dp, vertical = 8.dp)
                        ) {
                            if (pts.size < 2) return@Canvas
                            val minW = pts.minOf { it.second }
                            val maxW = pts.maxOf { it.second }
                            val range = (maxW - minW).let { if (it < 0.1) 1.0 else it }
                            val mapped = pts.mapIndexed { i, (_, w) ->
                                Offset(
                                    x = i.toFloat() / (pts.size - 1) * size.width,
                                    y = size.height - ((w - minW) / range).toFloat() * size.height * 0.85f - size.height * 0.05f
                                )
                            }
                            val path = Path()
                            mapped.forEachIndexed { i, pt ->
                                if (i == 0) path.moveTo(pt.x, pt.y) else path.lineTo(pt.x, pt.y)
                            }
                            drawPath(path, color = GrowthColor, style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round))
                            mapped.forEach { pt ->
                                drawCircle(color = GrowthColor, radius = 5.dp.toPx(), center = pt)
                            }
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            weightPts.firstOrNull()?.let { Text("${it.first}", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.4f)) }
                            weightPts.lastOrNull()?.let { Text("${it.first}", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.4f)) }
                        }
                    }
                }
            }
        }

        if (growthRecs.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 60.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("📏", fontSize = 44.sp)
                        Spacer(Modifier.height(12.dp))
                        Text("성장 기록이 없어요", color = MaterialTheme.colorScheme.onSurface.copy(0.4f))
                    }
                }
            }
        } else {
            items(growthRecs, key = { it.id }) { record ->
                GrowthRecordCard(record = record, onDelete = { onDeleteRecord(record.id) })
            }
        }
    }
}

@Composable
private fun GrowthRecordCard(record: BabyRecord, onDelete: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 5.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.Top,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .background(GrowthBg, RoundedCornerShape(14.dp)),
                contentAlignment = Alignment.Center
            ) { Text("📏", fontSize = 20.sp) }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(record.date, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = GrowthColor)
                if (record.weight != null) Text("체중 ${record.weight}kg", fontSize = 13.sp)
                if (record.height != null) Text("키 ${record.height}cm", fontSize = 13.sp)
                if (record.head != null) Text("두위 ${record.head}cm", fontSize = 13.sp)
                record.memo?.takeIf { it.isNotEmpty() }?.let {
                    Text("📝 $it", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.5f))
                }
            }
            TextButton(
                onClick = onDelete,
                contentPadding = PaddingValues(0.dp),
                modifier = Modifier.size(28.dp)
            ) { Text("×", fontSize = 18.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.3f)) }
        }
    }
}
