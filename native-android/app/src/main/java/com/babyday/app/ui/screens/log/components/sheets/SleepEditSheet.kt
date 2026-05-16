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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.babyday.app.data.model.BabyRecord
import com.babyday.app.ui.theme.SleepColor
import com.babyday.app.util.DateUtils

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SleepEditSheet(
    record: BabyRecord,
    onSave: (startTime: String, endTime: String?) -> Unit,
    onDismiss: () -> Unit
) {
    val parseHhmm: (String) -> String = { iso ->
        val fmt = DateUtils.fmtTime(iso)
        if (fmt == "--:--") {
            val c = java.util.Calendar.getInstance()
            "${c.get(java.util.Calendar.HOUR_OF_DAY).toString().padStart(2, '0')}:${c.get(java.util.Calendar.MINUTE).toString().padStart(2, '0')}"
        } else fmt
    }
    var startTime by remember { mutableStateOf(parseHhmm(record.startTime)) }
    var endTime by remember { mutableStateOf(record.endTime?.let { parseHhmm(it) } ?: "") }
    val nowHhmm = remember {
        val c = java.util.Calendar.getInstance()
        "${c.get(java.util.Calendar.HOUR_OF_DAY).toString().padStart(2, '0')}:${c.get(java.util.Calendar.MINUTE).toString().padStart(2, '0')}"
    }

    val durationLabel = if (record.endTime != null) {
        DateUtils.durLabel(DateUtils.durMin(record.startTime, record.endTime))
    } else "진행 중"

    ModalBottomSheet(onDismissRequest = onDismiss, dragHandle = { BottomSheetDefaults.DragHandle() }) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 4.dp)
        ) {
            Text(
                "😴 수면 수정", fontWeight = FontWeight.Bold, fontSize = 17.sp,
                modifier = Modifier.align(Alignment.CenterHorizontally).padding(bottom = 8.dp)
            )
            Text(
                durationLabel, fontSize = 14.sp, color = SleepColor,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.align(Alignment.CenterHorizontally).padding(bottom = 14.dp)
            )
            Text("시작 시간", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.6f))
            TimeAdjuster(time = startTime, onTimeChange = { startTime = it }, color = SleepColor)
            Spacer(Modifier.height(10.dp))
            if (record.endTime == null) {
                Button(
                    onClick = { endTime = nowHhmm },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = SleepColor)
                ) {
                    Text("지금 일어났어요!")
                }
                Spacer(Modifier.height(8.dp))
            }
            if (endTime.isNotEmpty() || record.endTime != null) {
                Text("종료 시간", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.6f))
                TimeAdjuster(
                    time = endTime.ifEmpty { nowHhmm },
                    onTimeChange = { endTime = it },
                    color = SleepColor
                )
                Spacer(Modifier.height(8.dp))
            } else {
                Text("종료 시간 (미설정)", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.4f))
                TimeAdjuster(
                    time = nowHhmm,
                    onTimeChange = { endTime = it },
                    color = SleepColor
                )
                Spacer(Modifier.height(8.dp))
            }
            Spacer(Modifier.height(12.dp))
            Button(
                onClick = {
                    onSave(startTime, endTime.ifEmpty { null })
                    onDismiss()
                },
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
