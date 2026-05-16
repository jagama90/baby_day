package com.babyday.app.ui.screens.log.components.sheets

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.babyday.app.data.model.BabyRecord
import com.babyday.app.ui.theme.DiaperBg
import com.babyday.app.ui.theme.DiaperColor
import com.babyday.app.util.DateUtils

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiaperEditSheet(
    record: BabyRecord,
    onSave: (kind: String, startTime: String) -> Unit,
    onDismiss: () -> Unit
) {
    val initTime = remember {
        val fmt = DateUtils.fmtTime(record.startTime)
        if (fmt == "--:--") {
            val c = java.util.Calendar.getInstance()
            "${c.get(java.util.Calendar.HOUR_OF_DAY).toString().padStart(2, '0')}:${c.get(java.util.Calendar.MINUTE).toString().padStart(2, '0')}"
        } else fmt
    }
    var startTime by remember { mutableStateOf(initTime) }
    var diaperKind by remember { mutableStateOf(record.diaperKind ?: "urine") }

    ModalBottomSheet(onDismissRequest = onDismiss, dragHandle = { BottomSheetDefaults.DragHandle() }) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 4.dp)
        ) {
            Text(
                "💧 기저귀 수정", fontWeight = FontWeight.Bold, fontSize = 17.sp,
                modifier = Modifier.align(Alignment.CenterHorizontally).padding(bottom = 14.dp)
            )
            TimeAdjuster(time = startTime, onTimeChange = { startTime = it }, color = DiaperColor)
            Spacer(Modifier.height(12.dp))
            Row(
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                listOf("urine" to "💧\n소변", "stool" to "💩\n대변", "both" to "🔄\n둘다").forEach { (k, lbl) ->
                    OutlinedButton(
                        onClick = { diaperKind = k },
                        modifier = Modifier.weight(1f).height(80.dp),
                        colors = if (diaperKind == k) ButtonDefaults.outlinedButtonColors(containerColor = DiaperBg)
                        else ButtonDefaults.outlinedButtonColors()
                    ) {
                        Text(lbl, textAlign = TextAlign.Center, fontSize = 14.sp)
                    }
                }
            }
            Spacer(Modifier.height(20.dp))
            Button(
                onClick = { onSave(diaperKind, startTime); onDismiss() },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                Text("저장", fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
            TextButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) { Text("취소") }
            Spacer(Modifier.height(8.dp))
        }
    }
}
