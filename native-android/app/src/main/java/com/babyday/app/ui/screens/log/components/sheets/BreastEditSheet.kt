package com.babyday.app.ui.screens.log.components.sheets

import androidx.compose.foundation.background
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
import com.babyday.app.ui.theme.BreastBg
import com.babyday.app.ui.theme.BreastColor
import com.babyday.app.util.DateUtils

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BreastEditSheet(
    record: BabyRecord,
    onSave: (leftMin: Int, rightMin: Int, startTime: String) -> Unit,
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
    var leftMin by remember { mutableIntStateOf(record.leftMin ?: 0) }
    var rightMin by remember { mutableIntStateOf(record.rightMin ?: 0) }

    ModalBottomSheet(onDismissRequest = onDismiss, dragHandle = { BottomSheetDefaults.DragHandle() }) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 4.dp)
        ) {
            Text(
                "🤱 모유 수정", fontWeight = FontWeight.Bold, fontSize = 17.sp,
                modifier = Modifier.align(Alignment.CenterHorizontally).padding(bottom = 14.dp)
            )
            TimeAdjuster(time = startTime, onTimeChange = { startTime = it }, color = BreastColor)
            Spacer(Modifier.height(12.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(BreastBg, RoundedCornerShape(12.dp))
                    .padding(12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(8.dp))
                        .padding(10.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("왼쪽", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.6f))
                    Text("$leftMin", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = BreastColor)
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        FilledTonalButton(
                            onClick = { leftMin = maxOf(0, leftMin - 1) },
                            modifier = Modifier.size(36.dp),
                            contentPadding = PaddingValues(0.dp)
                        ) { Text("−") }
                        FilledTonalButton(
                            onClick = { leftMin++ },
                            modifier = Modifier.size(36.dp),
                            contentPadding = PaddingValues(0.dp)
                        ) { Text("+") }
                    }
                }
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(8.dp))
                        .padding(10.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("오른쪽", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.6f))
                    Text("$rightMin", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = BreastColor)
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        FilledTonalButton(
                            onClick = { rightMin = maxOf(0, rightMin - 1) },
                            modifier = Modifier.size(36.dp),
                            contentPadding = PaddingValues(0.dp)
                        ) { Text("−") }
                        FilledTonalButton(
                            onClick = { rightMin++ },
                            modifier = Modifier.size(36.dp),
                            contentPadding = PaddingValues(0.dp)
                        ) { Text("+") }
                    }
                }
            }
            Text(
                "총 ${leftMin + rightMin}분", fontSize = 13.sp,
                color = BreastColor, fontWeight = FontWeight.SemiBold,
                modifier = Modifier.align(Alignment.CenterHorizontally).padding(top = 8.dp)
            )
            Spacer(Modifier.height(20.dp))
            Button(
                onClick = { onSave(leftMin, rightMin, startTime); onDismiss() },
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
