package com.babyday.app.ui.screens.log.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.babyday.app.data.model.BabyRecord
import com.babyday.app.ui.theme.HospitalBg
import com.babyday.app.ui.theme.HospitalColor
import com.babyday.app.ui.theme.Primary

@Composable
fun HospitalTab(
    records: List<BabyRecord>,
    onOpenAddSheet: (type: String) -> Unit,
    onDeleteRecord: (String) -> Unit
) {
    val hospitalRecs = records.filter { it.type == "hospital" }.sortedByDescending { it.date }

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
                Text("병원 기록", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Button(
                    onClick = { onOpenAddSheet("hospital") },
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("+ 병원 기록 추가")
                }
            }
        }

        if (hospitalRecs.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 60.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("🏥", fontSize = 44.sp)
                        Spacer(Modifier.height(12.dp))
                        Text("병원 기록이 없어요", color = MaterialTheme.colorScheme.onSurface.copy(0.4f))
                    }
                }
            }
        } else {
            items(hospitalRecs, key = { it.id }) { record ->
                HospitalRecordCard(record = record, onDelete = { onDeleteRecord(record.id) })
            }
        }
    }
}

@Composable
private fun HospitalRecordCard(record: BabyRecord, onDelete: () -> Unit) {
    val visitTypeLabel = when (record.hospitalType) {
        "checkup" -> "정기검진"
        "vaccine" -> "예방접종"
        "sick" -> "진료"
        else -> record.hospitalType ?: "방문"
    }
    val visitTypeBg = when (record.hospitalType) {
        "vaccine" -> Primary.copy(alpha = 0.1f)
        "sick" -> HospitalColor.copy(alpha = 0.1f)
        else -> HospitalBg
    }
    val visitTypeFg = when (record.hospitalType) {
        "vaccine" -> Primary
        "sick" -> HospitalColor
        else -> HospitalColor
    }

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
                    .background(HospitalBg, RoundedCornerShape(14.dp)),
                contentAlignment = Alignment.Center
            ) { Text("🏥", fontSize = 20.sp) }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        record.hospitalName ?: "병원",
                        fontWeight = FontWeight.Bold, fontSize = 14.sp, color = HospitalColor
                    )
                    Box(
                        modifier = Modifier
                            .background(visitTypeBg, RoundedCornerShape(6.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(visitTypeLabel, fontSize = 11.sp, color = visitTypeFg, fontWeight = FontWeight.SemiBold)
                    }
                }
                Text(record.date, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.5f))
                record.vaccineName?.takeIf { it.isNotEmpty() }?.let {
                    Text("💉 $it", fontSize = 12.sp, color = Primary)
                }
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
