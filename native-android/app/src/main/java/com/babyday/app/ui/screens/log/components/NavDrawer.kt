package com.babyday.app.ui.screens.log.components

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.babyday.app.data.model.BabyMember
import com.babyday.app.ui.theme.Primary
import com.babyday.app.ui.theme.PrimaryLight
import kotlinx.coroutines.launch

@Composable
fun BabyNavDrawer(
    isOpen: Boolean,
    currentUser: Any?,
    babies: List<BabyMember>,
    currentBabyId: String?,
    darkMode: Boolean,
    onBabySelect: (String) -> Unit,
    onAddBaby: (name: String, birth: String, gender: String) -> Unit,
    onDeleteBaby: (String) -> Unit,
    onGenerateInviteCode: suspend () -> String,
    onJoinByCode: (String) -> Unit,
    onToggleDark: () -> Unit,
    onLogout: () -> Unit,
    onClose: () -> Unit,
    content: @Composable () -> Unit
) {
    val drawerState = rememberDrawerState(initialValue = if (isOpen) DrawerValue.Open else DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    LaunchedEffect(isOpen) {
        if (isOpen) drawerState.open() else drawerState.close()
    }
    LaunchedEffect(drawerState.currentValue) {
        if (drawerState.currentValue == DrawerValue.Closed && isOpen) onClose()
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            DrawerContent(
                babies = babies,
                currentBabyId = currentBabyId,
                darkMode = darkMode,
                onBabySelect = { id -> onBabySelect(id); scope.launch { drawerState.close() }; onClose() },
                onAddBaby = onAddBaby,
                onDeleteBaby = onDeleteBaby,
                onGenerateInviteCode = onGenerateInviteCode,
                onJoinByCode = onJoinByCode,
                onToggleDark = onToggleDark,
                onLogout = { onLogout(); scope.launch { drawerState.close() } }
            )
        },
        content = content
    )
}

@Composable
private fun DrawerContent(
    babies: List<BabyMember>,
    currentBabyId: String?,
    darkMode: Boolean,
    onBabySelect: (String) -> Unit,
    onAddBaby: (name: String, birth: String, gender: String) -> Unit,
    onDeleteBaby: (String) -> Unit,
    onGenerateInviteCode: suspend () -> String,
    onJoinByCode: (String) -> Unit,
    onToggleDark: () -> Unit,
    onLogout: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var showAddForm by remember { mutableStateOf(false) }
    var newName by remember { mutableStateOf("") }
    var newBirth by remember { mutableStateOf("") }
    var newGender by remember { mutableStateOf("male") }
    var showInviteDialog by remember { mutableStateOf(false) }
    var joinCode by remember { mutableStateOf("") }
    var showJoinInput by remember { mutableStateOf(false) }
    var deleteConfirmId by remember { mutableStateOf<String?>(null) }

    ModalDrawerSheet(modifier = Modifier.width(300.dp)) {
        Column(
            modifier = Modifier
                .fillMaxHeight()
                .verticalScroll(rememberScrollState())
        ) {
            // Header
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.horizontalGradient(
                            colors = listOf(Color(0xFF4A6CF7), Color(0xFF7B3FF2))
                        )
                    )
                    .padding(20.dp)
            ) {
                Column {
                    Text("안녕하세요 👋", fontSize = 12.sp, color = Color.White.copy(0.7f))
                    Text("BabyDay", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color.White)
                }
            }

            Spacer(Modifier.height(8.dp))

            // Our Babies section
            Text(
                "우리 아기",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface.copy(0.4f),
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
            )

            babies.forEach { member ->
                val isSelected = member.babyId == currentBabyId
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(if (isSelected) PrimaryLight else Color.Transparent)
                        .clickable { onBabySelect(member.babyId) }
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("👶", fontSize = 20.sp)
                        Spacer(Modifier.width(10.dp))
                        Column {
                            Text(
                                member.babies?.name ?: "아기",
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                fontSize = 14.sp,
                                color = if (isSelected) Primary else MaterialTheme.colorScheme.onSurface
                            )
                            member.babies?.birthDate?.let {
                                Text(
                                    "$it · ${member.roleLabel}",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(0.5f)
                                )
                            }
                        }
                    }
                    TextButton(
                        onClick = { deleteConfirmId = member.babyId },
                        contentPadding = PaddingValues(0.dp),
                        modifier = Modifier.size(28.dp)
                    ) {
                        Text("×", fontSize = 16.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.3f))
                    }
                }
            }

            // Add baby button
            TextButton(
                onClick = { showAddForm = !showAddForm },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp)
                    .border(1.dp, MaterialTheme.colorScheme.outline.copy(0.3f), RoundedCornerShape(10.dp))
            ) {
                Text("+ 아기 추가하기", fontSize = 13.sp)
            }

            if (showAddForm) {
                Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                    OutlinedTextField(
                        value = newName,
                        onValueChange = { newName = it },
                        label = { Text("이름") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(Modifier.height(6.dp))
                    OutlinedTextField(
                        value = newBirth,
                        onValueChange = { newBirth = it },
                        label = { Text("생년월일 (yyyy-MM-dd)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                    )
                    Spacer(Modifier.height(6.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("male" to "남아", "female" to "여아").forEach { (k, lbl) ->
                            FilterChip(
                                selected = newGender == k,
                                onClick = { newGender = k },
                                label = { Text(lbl) }
                            )
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(
                            onClick = { showAddForm = false; newName = ""; newBirth = ""; newGender = "male" },
                            modifier = Modifier.weight(1f)
                        ) { Text("취소") }
                        Button(
                            onClick = {
                                if (newName.isNotEmpty() && newBirth.isNotEmpty()) {
                                    onAddBaby(newName, newBirth, newGender)
                                    showAddForm = false; newName = ""; newBirth = ""; newGender = "male"
                                }
                            },
                            modifier = Modifier.weight(1f)
                        ) { Text("등록") }
                    }
                }
            }

            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

            // Invite codes section
            Text(
                "초대코드",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface.copy(0.4f),
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
            )

            TextButton(
                onClick = {
                    val babyId = currentBabyId ?: return@TextButton
                    scope.launch {
                        val code = onGenerateInviteCode()
                        if (code.isNotEmpty()) {
                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                            clipboard.setPrimaryClip(ClipData.newPlainText("invite_code", code))
                            showInviteDialog = true
                            joinCode = code
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp)
            ) { Text("🔗 초대코드 생성") }

            TextButton(
                onClick = { showJoinInput = !showJoinInput },
                modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp)
            ) { Text("🔑 초대코드 입력") }

            if (showJoinInput) {
                Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
                    OutlinedTextField(
                        value = joinCode,
                        onValueChange = { joinCode = it.uppercase() },
                        label = { Text("6자리 초대코드") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(Modifier.height(6.dp))
                    Button(
                        onClick = {
                            if (joinCode.length == 6) {
                                onJoinByCode(joinCode)
                                showJoinInput = false
                                joinCode = ""
                            }
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) { Text("참여하기") }
                }
            }

            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

            // Settings
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("다크모드", fontSize = 14.sp)
                Switch(checked = darkMode, onCheckedChange = { onToggleDark() })
            }

            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

            // Logout
            TextButton(
                onClick = onLogout,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text("로그아웃", color = MaterialTheme.colorScheme.error)
            }

            Spacer(Modifier.height(24.dp))
        }
    }

    // Delete confirm dialog
    deleteConfirmId?.let { id ->
        val baby = babies.find { it.babyId == id }
        AlertDialog(
            onDismissRequest = { deleteConfirmId = null },
            title = { Text("아기 삭제") },
            text = { Text("${baby?.babies?.name ?: "아기"} 정보와 모든 기록을 삭제할까요?") },
            confirmButton = {
                TextButton(onClick = { onDeleteBaby(id); deleteConfirmId = null }) {
                    Text("삭제", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { deleteConfirmId = null }) { Text("취소") }
            }
        )
    }

    // Invite code display dialog
    if (showInviteDialog) {
        AlertDialog(
            onDismissRequest = { showInviteDialog = false },
            title = { Text("초대코드 생성됨") },
            text = {
                Column {
                    Text("24시간 유효한 초대코드:")
                    Spacer(Modifier.height(8.dp))
                    Text(
                        joinCode,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Black,
                        color = Primary,
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    )
                    Spacer(Modifier.height(4.dp))
                    Text("클립보드에 복사되었어요", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(0.5f))
                }
            },
            confirmButton = {
                TextButton(onClick = { showInviteDialog = false; joinCode = "" }) { Text("확인") }
            }
        )
    }
}
