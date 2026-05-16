package com.babyday.app.ui.screens.baby

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.babyday.app.data.model.BabyMember
import com.babyday.app.ui.theme.Primary
import com.babyday.app.util.DateUtils

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BabyProfileSheet(
    member: BabyMember,
    nowTs: Long,
    onSave: (babyId: String, fields: Map<String, Any?>) -> Unit,
    onDismiss: () -> Unit
) {
    val baby = member.babies
    var name by remember { mutableStateOf(baby?.name ?: "") }
    var birthDate by remember { mutableStateOf(baby?.birthDate ?: "") }
    var dueDate by remember { mutableStateOf(baby?.dueDate ?: "") }
    var birthWeight by remember { mutableStateOf(baby?.birthWeight?.toString() ?: "") }
    var birthHeight by remember { mutableStateOf(baby?.birthHeight?.toString() ?: "") }
    var birthHead by remember { mutableStateOf(baby?.birthHead?.toString() ?: "") }
    var birthHospital by remember { mutableStateOf(baby?.birthHospital ?: "") }
    var gender by remember { mutableStateOf(baby?.gender ?: "male") }
    var feedingType by remember { mutableStateOf(baby?.feedingType ?: "mixed") }
    var bloodType by remember { mutableStateOf(baby?.bloodType ?: "") }

    // D+ calculation
    val daysOld = if (birthDate.isNotEmpty()) DateUtils.daysSince(birthDate) else 0
    val weeksOld = daysOld / 7
    val remainDays = daysOld % 7

    // Milestones
    val milestones = listOf(100, 200, 365, 500, 1000)

    ModalBottomSheet(onDismissRequest = onDismiss, dragHandle = { BottomSheetDefaults.DragHandle() }) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 4.dp)
        ) {
            // Baby name + age
            Text(
                "👶 ${baby?.name ?: name}",
                fontSize = 20.sp, fontWeight = FontWeight.Black,
                modifier = Modifier.align(Alignment.CenterHorizontally)
            )
            if (daysOld > 0) {
                Text(
                    "D+${daysOld}일 · ${weeksOld}주 ${remainDays}일",
                    fontSize = 13.sp, color = Primary,
                    modifier = Modifier.align(Alignment.CenterHorizontally).padding(top = 2.dp, bottom = 12.dp)
                )
            }

            // Milestones
            if (daysOld > 0 && birthDate.isNotEmpty()) {
                Card(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(0.3f))
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("다가올 기념일", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Primary)
                        Spacer(Modifier.height(6.dp))
                        milestones.filter { it > daysOld }.take(3).forEach { m ->
                            val remaining = m - daysOld
                            Text("D+${m}일 — ${remaining}일 후", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.7f))
                        }
                    }
                }
            }

            HorizontalDivider(modifier = Modifier.padding(bottom = 12.dp))

            // Editable fields
            OutlinedTextField(
                value = name, onValueChange = { name = it },
                label = { Text("이름") }, modifier = Modifier.fillMaxWidth()
            )
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = birthDate, onValueChange = { birthDate = it },
                label = { Text("생년월일 (yyyy-MM-dd)") }, modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
            )
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = dueDate, onValueChange = { dueDate = it },
                label = { Text("출생예정일 (선택)") }, modifier = Modifier.fillMaxWidth()
            )
            Spacer(Modifier.height(8.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = birthWeight, onValueChange = { birthWeight = it },
                    label = { Text("출생몸무게 (g)") }, modifier = Modifier.weight(1f),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                )
                OutlinedTextField(
                    value = birthHeight, onValueChange = { birthHeight = it },
                    label = { Text("출생키 (cm)") }, modifier = Modifier.weight(1f),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                )
            }
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = birthHead, onValueChange = { birthHead = it },
                    label = { Text("출생두위 (cm)") }, modifier = Modifier.weight(1f),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                )
                OutlinedTextField(
                    value = birthHospital, onValueChange = { birthHospital = it },
                    label = { Text("출생병원") }, modifier = Modifier.weight(1f)
                )
            }
            Spacer(Modifier.height(10.dp))

            // Gender toggle
            Text("성별", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.6f))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 4.dp)) {
                listOf("male" to "남아", "female" to "여아").forEach { (k, lbl) ->
                    FilterChip(selected = gender == k, onClick = { gender = k }, label = { Text(lbl) })
                }
            }
            Spacer(Modifier.height(8.dp))

            // Feeding type toggle
            Text("수유방식", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.6f))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 4.dp)) {
                listOf("breast" to "모유", "formula" to "분유", "mixed" to "혼합").forEach { (k, lbl) ->
                    FilterChip(selected = feedingType == k, onClick = { feedingType = k }, label = { Text(lbl) })
                }
            }
            Spacer(Modifier.height(8.dp))

            // Blood type
            Text("혈액형", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.6f))
            var bloodExpanded by remember { mutableStateOf(false) }
            ExposedDropdownMenuBox(
                expanded = bloodExpanded,
                onExpandedChange = { bloodExpanded = !bloodExpanded },
                modifier = Modifier.fillMaxWidth().padding(top = 4.dp)
            ) {
                OutlinedTextField(
                    value = bloodType.ifEmpty { "선택" },
                    onValueChange = {},
                    readOnly = true,
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = bloodExpanded) },
                    modifier = Modifier.menuAnchor().fillMaxWidth()
                )
                ExposedDropdownMenu(
                    expanded = bloodExpanded,
                    onDismissRequest = { bloodExpanded = false }
                ) {
                    listOf("A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-").forEach { bt ->
                        DropdownMenuItem(
                            text = { Text(bt) },
                            onClick = { bloodType = bt; bloodExpanded = false }
                        )
                    }
                }
            }

            Spacer(Modifier.height(20.dp))
            Button(
                onClick = {
                    val fields = mutableMapOf<String, Any?>()
                    fields["name"] = name
                    if (birthDate.isNotEmpty()) fields["birth_date"] = birthDate
                    if (dueDate.isNotEmpty()) fields["due_date"] = dueDate
                    birthWeight.toDoubleOrNull()?.let { fields["birth_weight"] = it }
                    birthHeight.toDoubleOrNull()?.let { fields["birth_height"] = it }
                    birthHead.toDoubleOrNull()?.let { fields["birth_head"] = it }
                    if (birthHospital.isNotEmpty()) fields["birth_hospital"] = birthHospital
                    fields["gender"] = gender
                    fields["feeding_type"] = feedingType
                    if (bloodType.isNotEmpty()) fields["blood_type"] = bloodType
                    onSave(member.babyId, fields)
                    onDismiss()
                },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                Text("저장", fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
            TextButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) { Text("닫기") }
            Spacer(Modifier.height(8.dp))
        }
    }
}
