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
import com.babyday.app.ui.theme.FormulaColor
import com.babyday.app.util.DateUtils

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FormulaEditSheet(
    record: BabyRecord,
    onSave: (ml: Int, startTime: String) -> Unit,
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
    var ml by remember { mutableIntStateOf(record.ml ?: 0) }

    ModalBottomSheet(onDismissRequest = onDismiss, dragHandle = { BottomSheetDefaults.DragHandle() }) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 4.dp)
        ) {
            Text(
                "🍼 분유 수정", fontWeight = FontWeight.Bold, fontSize = 17.sp,
                modifier = Modifier.align(Alignment.CenterHorizontally).padding(bottom = 14.dp)
            )
            TimeAdjuster(time = startTime, onTimeChange = { startTime = it }, color = FormulaColor)
            Spacer(Modifier.height(12.dp))
            Text(
                "${ml}ml", fontSize = 40.sp, fontWeight = FontWeight.Black,
                color = FormulaColor, modifier = Modifier.align(Alignment.CenterHorizontally)
            )
            Text(
                "ml", fontSize = 13.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(0.5f),
                modifier = Modifier.align(Alignment.CenterHorizontally)
            )
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                listOf(-20, -10, -5, 5, 10, 20).forEach { d ->
                    OutlinedButton(
                        onClick = { ml = maxOf(0, ml + d) },
                        modifier = Modifier.weight(1f).height(42.dp),
                        contentPadding = PaddingValues(0.dp)
                    ) {
                        Text(if (d > 0) "+$d" else "$d", fontSize = 12.sp)
                    }
                }
            }
            Spacer(Modifier.height(20.dp))
            Button(
                onClick = { onSave(ml, startTime); onDismiss() },
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
