package com.babyday.app.ui.screens.log.components.sheets

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.babyday.app.ui.theme.*
import com.babyday.app.util.DateUtils
import com.babyday.app.util.LogUtils

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddRecordSheet(
    initialType: String = "formula",
    selDateStr: String,
    babyId: String,
    onSaveFormula: (ds: String, time: String, ml: Int) -> Unit,
    onSaveBreast: (ds: String, time: String, leftMin: Int, rightMin: Int) -> Unit,
    onSaveSleep: (ds: String, time: String, endTime: String?, kind: String) -> Unit,
    onSaveDiaper: (ds: String, time: String, kind: String) -> Unit,
    onSaveGrowth: (date: String, weight: Double?, height: Double?, head: Double?, memo: String?) -> Unit,
    onSaveHospital: (date: String, name: String, type: String, vaccine: String?, memo: String?) -> Unit,
    onDismiss: () -> Unit
) {
    var type by remember { mutableStateOf(initialType) }
    val nowHhmm = remember {
        val c = java.util.Calendar.getInstance()
        "${c.get(java.util.Calendar.HOUR_OF_DAY).toString().padStart(2, '0')}:${c.get(java.util.Calendar.MINUTE).toString().padStart(2, '0')}"
    }
    var startTime by remember { mutableStateOf(nowHhmm) }
    var endTime by remember { mutableStateOf("") }
    var ml by remember { mutableIntStateOf(0) }
    var leftMin by remember { mutableIntStateOf(0) }
    var rightMin by remember { mutableIntStateOf(0) }
    var sleepKind by remember { mutableStateOf("nap") }
    var diaperKind by remember { mutableStateOf("urine") }
    var gDate by remember { mutableStateOf(selDateStr) }
    var gWeight by remember { mutableStateOf("") }
    var gHeight by remember { mutableStateOf("") }
    var gHead by remember { mutableStateOf("") }
    var gMemo by remember { mutableStateOf("") }
    var hDate by remember { mutableStateOf(selDateStr) }
    var hName by remember { mutableStateOf("") }
    var hType by remember { mutableStateOf("checkup") }
    var hVaccine by remember { mutableStateOf("") }
    var hMemo by remember { mutableStateOf("") }

    ModalBottomSheet(onDismissRequest = onDismiss, dragHandle = { BottomSheetDefaults.DragHandle() }) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 4.dp)
        ) {
            if (type !in listOf("formula", "breast")) {
                Text(
                    text = "${LogUtils.EMOJI[type] ?: ""} ${LogUtils.LABEL[type] ?: type} 기록",
                    fontWeight = FontWeight.Bold, fontSize = 17.sp,
                    modifier = Modifier.align(Alignment.CenterHorizontally).padding(bottom = 12.dp)
                )
                val types = listOf("sleep", "formula", "breast", "diaper", "growth", "hospital")
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    types.chunked(3).forEach { row ->
                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            row.forEach { t ->
                                OutlinedButton(
                                    onClick = { type = t },
                                    modifier = Modifier.fillMaxWidth().height(64.dp),
                                    shape = RoundedCornerShape(10.dp),
                                    colors = if (type == t) ButtonDefaults.outlinedButtonColors(containerColor = PrimaryLight)
                                    else ButtonDefaults.outlinedButtonColors()
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text(LogUtils.EMOJI[t] ?: "", fontSize = 22.sp)
                                        Text(LogUtils.LABEL[t] ?: t, fontSize = 11.sp)
                                    }
                                }
                            }
                        }
                    }
                }
                Spacer(Modifier.height(16.dp))
            } else {
                Text(
                    text = "${LogUtils.EMOJI[type] ?: ""} ${LogUtils.LABEL[type] ?: type} 기록",
                    fontWeight = FontWeight.Bold, fontSize = 17.sp,
                    modifier = Modifier.align(Alignment.CenterHorizontally).padding(bottom = 14.dp)
                )
            }

            when (type) {
                "formula" -> {
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
                }
                "breast" -> {
                    TimeAdjuster(time = startTime, onTimeChange = { startTime = it }, color = BreastColor)
                    Spacer(Modifier.height(12.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(BreastBg, RoundedCornerShape(12.dp))
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Left side
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
                        // Right side
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
                }
                "sleep" -> {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(MaterialTheme.colorScheme.background, RoundedCornerShape(10.dp)),
                        horizontalArrangement = Arrangement.spacedBy(0.dp)
                    ) {
                        listOf("nap" to "🌙 낮잠", "night" to "⭐ 밤잠").forEach { (k, lbl) ->
                            Button(
                                onClick = { sleepKind = k },
                                modifier = Modifier.weight(1f),
                                colors = if (sleepKind == k) ButtonDefaults.buttonColors()
                                else ButtonDefaults.outlinedButtonColors()
                            ) { Text(lbl) }
                        }
                    }
                    Spacer(Modifier.height(10.dp))
                    Text("시작 시간", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.6f))
                    TimeAdjuster(time = startTime, onTimeChange = { startTime = it }, color = SleepColor)
                    Spacer(Modifier.height(10.dp))
                    Text("종료 시간 (선택)", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.6f))
                    TimeAdjuster(
                        time = endTime.ifEmpty { nowHhmm },
                        onTimeChange = { endTime = it },
                        color = SleepColor
                    )
                }
                "diaper" -> {
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
                }
                "growth" -> {
                    OutlinedTextField(
                        value = gDate, onValueChange = { gDate = it },
                        label = { Text("날짜") }, modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = gWeight, onValueChange = { gWeight = it },
                            label = { Text("몸무게 (kg)") }, modifier = Modifier.weight(1f),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                        )
                        OutlinedTextField(
                            value = gHeight, onValueChange = { gHeight = it },
                            label = { Text("키 (cm)") }, modifier = Modifier.weight(1f),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                        )
                    }
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = gHead, onValueChange = { gHead = it },
                        label = { Text("두위 (cm, 선택)") }, modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = gMemo, onValueChange = { gMemo = it },
                        label = { Text("메모") }, modifier = Modifier.fillMaxWidth(), minLines = 2
                    )
                }
                "hospital" -> {
                    OutlinedTextField(
                        value = hDate, onValueChange = { hDate = it },
                        label = { Text("날짜") }, modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = hName, onValueChange = { hName = it },
                        label = { Text("병원/기관명") }, modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf("checkup" to "정기검진", "vaccine" to "예방접종", "sick" to "진료").forEach { (k, lbl) ->
                            FilterChip(selected = hType == k, onClick = { hType = k }, label = { Text(lbl) })
                        }
                    }
                    if (hType == "vaccine") {
                        Spacer(Modifier.height(8.dp))
                        OutlinedTextField(
                            value = hVaccine, onValueChange = { hVaccine = it },
                            label = { Text("접종명") }, modifier = Modifier.fillMaxWidth()
                        )
                    }
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = hMemo, onValueChange = { hMemo = it },
                        label = { Text("메모") }, modifier = Modifier.fillMaxWidth(), minLines = 2
                    )
                }
            }

            Spacer(Modifier.height(20.dp))
            Button(
                onClick = {
                    when (type) {
                        "formula"  -> onSaveFormula(selDateStr, startTime, ml)
                        "breast"   -> onSaveBreast(selDateStr, startTime, leftMin, rightMin)
                        "sleep"    -> onSaveSleep(selDateStr, startTime, endTime.ifEmpty { null }, sleepKind)
                        "diaper"   -> onSaveDiaper(selDateStr, startTime, diaperKind)
                        "growth"   -> onSaveGrowth(gDate, gWeight.toDoubleOrNull(), gHeight.toDoubleOrNull(), gHead.toDoubleOrNull(), gMemo.ifEmpty { null })
                        "hospital" -> onSaveHospital(hDate, hName, hType, hVaccine.ifEmpty { null }, hMemo.ifEmpty { null })
                    }
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
