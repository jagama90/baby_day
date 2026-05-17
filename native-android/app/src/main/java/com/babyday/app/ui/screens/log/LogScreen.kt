package com.babyday.app.ui.screens.log

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.babyday.app.data.model.BabyRecord
import com.babyday.app.domain.PatternMessage
import com.babyday.app.ui.screens.baby.BabyProfileSheet
import com.babyday.app.ui.screens.log.components.*
import com.babyday.app.ui.screens.log.components.sheets.*
import com.babyday.app.ui.theme.*
import com.babyday.app.util.DateUtils
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.Date

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LogScreen(
    initialBabyId: String? = null,
    onLogout: () -> Unit,
    vm: LogViewModel = viewModel()
) {
    val scope = rememberCoroutineScope()
    val records by vm.records.collectAsStateWithLifecycle()
    val babies by vm.babies.collectAsStateWithLifecycle()
    val currentBabyId by vm.currentBabyId.collectAsStateWithLifecycle()
    val syncState by vm.syncState.collectAsStateWithLifecycle()
    val toast by vm.toast.collectAsStateWithLifecycle()
    val darkMode by vm.darkMode.collectAsStateWithLifecycle()
    val patternMessages by vm.patternMessages.collectAsStateWithLifecycle()

    var selDate by remember { mutableStateOf(Date()) }
    var currentTab by remember { mutableIntStateOf(0) }
    var showDrawer by remember { mutableStateOf(false) }

    // Sheet states
    var showAddSheet by remember { mutableStateOf(false) }
    var addSheetType by remember { mutableStateOf("formula") }
    var editFormulaRecord by remember { mutableStateOf<BabyRecord?>(null) }
    var editBreastRecord by remember { mutableStateOf<BabyRecord?>(null) }
    var editDiaperRecord by remember { mutableStateOf<BabyRecord?>(null) }
    var editSleepRecord by remember { mutableStateOf<BabyRecord?>(null) }
    var showBabyProfile by remember { mutableStateOf<com.babyday.app.data.model.BabyMember?>(null) }

    LaunchedEffect(Unit) { vm.initialize(initialBabyId) }

    // Tick every second to update ongoing sleep timer labels
    var sleepTimerTick by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(1000L)
            sleepTimerTick = System.currentTimeMillis()
        }
    }

    // Refresh pattern messages every minute so warnings stay accurate
    LaunchedEffect(Unit) {
        while (true) {
            delay(60_000L)
            vm.refreshPatterns()
        }
    }

    val snackbarHostState = remember { SnackbarHostState() }
    LaunchedEffect(toast) {
        toast?.let { msg ->
            snackbarHostState.showSnackbar(msg, duration = SnackbarDuration.Short)
            vm.clearToast()
        }
    }

    val currentBaby = babies.find { it.babyId == currentBabyId }
    val babyBirth = currentBaby?.babies?.birthDate
    val babyName = currentBaby?.babies?.name ?: "아기"
    val ageLabel = if (babyBirth != null) "D+${DateUtils.daysSince(babyBirth)}일" else ""
    val dsStr = DateUtils.fmtDate(selDate)
    val dayRecs = records.filter { it.date == dsStr }
        .filter { it.type != "growth" && it.type != "hospital" }
        .sortedByDescending { it.startTime }
    val sleepOngoing = records.any { it.type == "sleep" && it.endTime == null }

    BabyNavDrawer(
        isOpen = showDrawer,
        currentUser = null,
        babies = babies,
        currentBabyId = currentBabyId,
        darkMode = darkMode,
        onBabySelect = { id -> vm.selectBaby(id) },
        onAddBaby = { name, birth, gender -> vm.addBaby(name, birth, gender) },
        onDeleteBaby = { id -> vm.deleteBaby(id) },
        onGenerateInviteCode = {
            currentBabyId?.let { vm.generateInviteCode(it) } ?: ""
        },
        onJoinByCode = { code -> vm.joinByInviteCode(code) },
        onToggleDark = { vm.setDarkMode(!darkMode) },
        onLogout = { scope.launch { vm.signOut(); onLogout() } },
        onClose = { showDrawer = false }
    ) {
        Scaffold(
            snackbarHost = { SnackbarHost(snackbarHostState) },
            bottomBar = {
                Box(modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp)) {
                    VoiceInputButton(onResult = { vm.handleVoice(it) })
                }
            }
        ) { padding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            ) {
                // ── HEADER ──
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.horizontalGradient(
                                colors = listOf(Color(0xFF4A6CF7), Color(0xFF7B3FF2))
                            )
                        )
                        .padding(16.dp)
                ) {
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                IconButton(
                                    onClick = { showDrawer = true },
                                    modifier = Modifier.size(36.dp)
                                ) {
                                    Text("☰", fontSize = 20.sp, color = Color.White)
                                }
                                Spacer(Modifier.width(8.dp))
                                Column {
                                    Text(
                                        text = "👶 $babyName 기록",
                                        fontWeight = FontWeight.Black,
                                        fontSize = 20.sp,
                                        color = Color.White
                                    )
                                    if (ageLabel.isNotEmpty()) {
                                        Text(
                                            text = ageLabel,
                                            fontSize = 12.sp,
                                            color = Color.White.copy(alpha = 0.8f)
                                        )
                                    }
                                }
                            }
                            // Baby selector chips if multiple babies
                            if (babies.size > 1) {
                                babies.take(3).forEach { b ->
                                    val isSelected = b.babyId == currentBabyId
                                    TextButton(onClick = { vm.selectBaby(b.babyId) }) {
                                        Text(
                                            b.babies?.name ?: "아기",
                                            color = if (isSelected) Color.White else Color.White.copy(0.5f),
                                            fontSize = 12.sp,
                                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                        )
                                    }
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            val (dotColor, syncText) = when (syncState) {
                                LogViewModel.SyncState.CONNECTED    -> Color(0xFF4ADE80) to "실시간 동기화 중"
                                LogViewModel.SyncState.DISCONNECTED -> Color(0xFFFCA5A5) to "연결 실패"
                                LogViewModel.SyncState.LOADING      -> Color(0xFFFCD34D) to "불러오는 중..."
                            }
                            Box(modifier = Modifier.size(7.dp).background(dotColor, RoundedCornerShape(50)))
                            Text(syncText, fontSize = 11.sp, color = Color.White.copy(0.9f), fontWeight = FontWeight.Medium)
                        }
                    }
                }

                // ── TAB BAR ──
                val tabs = listOf("📋 기록", "📊 통계", "📏 성장", "🏥 병원")
                ScrollableTabRow(
                    selectedTabIndex = currentTab,
                    containerColor = MaterialTheme.colorScheme.surface,
                    edgePadding = 0.dp
                ) {
                    tabs.forEachIndexed { idx, title ->
                        Tab(
                            selected = currentTab == idx,
                            onClick = { currentTab = idx },
                            text = {
                                Text(
                                    title, fontSize = 12.sp,
                                    fontWeight = if (currentTab == idx) FontWeight.Bold else FontWeight.Normal
                                )
                            }
                        )
                    }
                }

                // ── QUICK BUTTONS (탭 위에 항상 표시) ──
                if (currentBabyId != null) {
                    QuickButtons(
                        onSleep       = { vm.quickAdd("sleep") },
                        onFormula     = { addSheetType = "formula"; showAddSheet = true },
                        onBreast      = { addSheetType = "breast";  showAddSheet = true },
                        onDiaperUrine = { vm.quickAdd("diaper", "urine") },
                        onDiaperStool = { vm.quickAdd("diaper", "stool") },
                        onDiaperBoth  = { vm.quickAdd("diaper", "both") },
                        onBath        = { vm.quickAdd("bath") },
                        isSleepOngoing = sleepOngoing
                    )
                }

                when (currentTab) {
                    0 -> HomeTabContent(
                        records = records,
                        dayRecs = dayRecs,
                        selDate = selDate,
                        onDateChange = { selDate = it },
                        onDeleteRecord = { id -> vm.deleteRecord(id) },
                        onEditRecord = { record ->
                            when (record.type) {
                                "formula"  -> editFormulaRecord = record
                                "breast"   -> editBreastRecord  = record
                                "diaper"   -> editDiaperRecord  = record
                                "sleep"    -> editSleepRecord   = record
                                else       -> {}
                            }
                        },
                        showToast = vm::showToast,
                        currentBabyId = currentBabyId,
                        patternMessages = patternMessages,
                        sleepTimerTick = sleepTimerTick,
                    )
                    1 -> StatsTab(records = records, babyBirth = babyBirth)
                    2 -> GrowthTab(
                        records = records,
                        onOpenAddSheet = { type -> addSheetType = type; showAddSheet = true },
                        onDeleteRecord = { id -> vm.deleteRecord(id) }
                    )
                    3 -> HospitalTab(
                        records = records,
                        onOpenAddSheet = { type -> addSheetType = type; showAddSheet = true },
                        onDeleteRecord = { id -> vm.deleteRecord(id) }
                    )
                }
            }
        }
    }

    // ── SHEETS ────────────────────────────────────────────────────────────────
    val babyIdForSheet = currentBabyId ?: ""

    if (showAddSheet) {
        AddRecordSheet(
            initialType = addSheetType,
            selDateStr = dsStr,
            babyId = babyIdForSheet,
            onSaveFormula  = { ds, time, ml       -> vm.saveFormulaRecord(babyIdForSheet, ds, time, ml) },
            onSaveBreast   = { ds, time, l, r      -> vm.saveBreastRecord(babyIdForSheet, ds, time, l, r) },
            onSaveSleep    = { ds, time, end, kind -> vm.saveSleepRecord(babyIdForSheet, ds, time, end, kind) },
            onSaveDiaper   = { ds, time, kind      -> vm.saveDiaperRecord(babyIdForSheet, ds, time, kind) },
            onSaveGrowth   = { date, w, h, head, memo -> vm.saveGrowthRecord(babyIdForSheet, date, w, h, head, memo) },
            onSaveHospital = { date, n, t, v, memo -> vm.saveHospitalRecord(babyIdForSheet, date, n, t, v, memo) },
            onDismiss      = { showAddSheet = false }
        )
    }

    editFormulaRecord?.let { record ->
        FormulaEditSheet(
            record = record,
            onSave = { ml, time -> vm.updateFormulaRecord(record, ml, time) },
            onDismiss = { editFormulaRecord = null }
        )
    }
    editBreastRecord?.let { record ->
        BreastEditSheet(
            record = record,
            onSave = { l, r, time -> vm.updateBreastRecord(record, l, r, time) },
            onDismiss = { editBreastRecord = null }
        )
    }
    editDiaperRecord?.let { record ->
        DiaperEditSheet(
            record = record,
            onSave = { kind, time -> vm.updateDiaperRecord(record, kind, time) },
            onDismiss = { editDiaperRecord = null }
        )
    }
    editSleepRecord?.let { record ->
        SleepEditSheet(
            record = record,
            onSave = { start, end -> vm.updateSleepRecord(record, start, end) },
            onDismiss = { editSleepRecord = null }
        )
    }
    showBabyProfile?.let { member ->
        BabyProfileSheet(
            member = member,
            nowTs = System.currentTimeMillis(),
            onSave = { id, fields -> vm.updateBaby(id, fields) },
            onDismiss = { showBabyProfile = null }
        )
    }
}

@Composable
private fun HomeTabContent(
    records: List<BabyRecord>,
    dayRecs: List<BabyRecord>,
    selDate: Date,
    onDateChange: (Date) -> Unit,
    onDeleteRecord: (String) -> Unit,
    onEditRecord: (BabyRecord) -> Unit,
    showToast: (String) -> Unit,
    currentBabyId: String?,
    patternMessages: List<PatternMessage>,
    sleepTimerTick: Long,
) {
    if (currentBabyId == null) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("👶", fontSize = 48.sp)
                Spacer(Modifier.height(12.dp))
                Text(
                    "☰ 메뉴에서 아기를 등록해주세요",
                    color = MaterialTheme.colorScheme.onSurface.copy(0.4f),
                    fontWeight = FontWeight.Medium
                )
            }
        }
        return
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // Pattern messages
        if (patternMessages.isNotEmpty()) {
            patternMessages.take(2).forEach { msg ->
                val bg = if (msg.isWarning) Color(0xFFFFF3CD) else com.babyday.app.ui.theme.PrimaryLight
                val fg = if (msg.isWarning) Color(0xFF856404) else Primary
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(bg)
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                ) {
                    Text(msg.text, fontSize = 12.sp, color = fg)
                }
            }
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 100.dp)
        ) {
            item { LastActivityCards(records = records) }
            item { DateNavigator(selDate = selDate, onDateChange = onDateChange) }
            item { SummaryChips(records = dayRecs) }

            if (dayRecs.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 60.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("📋", fontSize = 44.sp)
                            Spacer(Modifier.height(12.dp))
                            Text("이 날의 기록이 없어요", color = MaterialTheme.colorScheme.onSurface.copy(0.4f))
                        }
                    }
                }
            } else {
                items(dayRecs, key = { it.id }) { record ->
                    val editable = record.type in listOf("formula", "breast", "diaper", "sleep")
                    val sleepLabel = if (record.type == "sleep" && record.endTime == null) {
                        val mins = ((sleepTimerTick - DateUtils.parseIso(record.startTime)) / 60000L).toInt()
                        "진행 중 · ${DateUtils.durLabel(mins)}"
                    } else null
                    LogCard(
                        record = record,
                        sleepTimerLabel = sleepLabel,
                        onClick = if (editable) ({ onEditRecord(record) }) else null,
                        onDelete = { onDeleteRecord(record.id) }
                    )
                }
            }
        }
    }
}

@Composable
private fun DateNavigator(selDate: Date, onDateChange: (Date) -> Unit) {
    val days = listOf("일", "월", "화", "수", "목", "금", "토")
    val cal = java.util.Calendar.getInstance().apply { time = selDate }
    val label = "${cal.get(java.util.Calendar.MONTH) + 1}월 ${cal.get(java.util.Calendar.DAY_OF_MONTH)}일 (${days[cal.get(java.util.Calendar.DAY_OF_WEEK) - 1]})"

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface)
            .padding(4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        TextButton(onClick = {
            val c = java.util.Calendar.getInstance().apply { time = selDate; add(java.util.Calendar.DAY_OF_MONTH, -1) }
            onDateChange(c.time)
        }) { Text("‹", fontSize = 22.sp) }

        Text(text = label, fontWeight = FontWeight.Bold, fontSize = 15.sp)

        TextButton(onClick = {
            val c = java.util.Calendar.getInstance().apply { time = selDate; add(java.util.Calendar.DAY_OF_MONTH, 1) }
            onDateChange(c.time)
        }) { Text("›", fontSize = 22.sp) }
    }
    HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.4f))
}

@Composable
private fun SummaryChips(records: List<BabyRecord>) {
    val sleepMin = records.filter { it.type == "sleep" && it.endTime != null }
        .sumOf { DateUtils.durMin(it.startTime, it.endTime!!) }
    val formulaMl = records.filter { it.type == "formula" }.sumOf { it.ml ?: 0 }
    val feedCount = records.count { it.type == "breast" || it.type == "formula" }
    val diaperCount = records.count { it.type == "diaper" }
    val bathCount = records.count { it.type == "bath" }

    if (sleepMin == 0 && formulaMl == 0 && feedCount == 0 && diaperCount == 0 && bathCount == 0) return

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface)
            .padding(horizontal = 16.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        if (sleepMin > 0) SummaryChip("😴 ${DateUtils.durLabel(sleepMin)}", com.babyday.app.ui.theme.SleepBg, com.babyday.app.ui.theme.SleepColor)
        if (formulaMl > 0) SummaryChip("🍼 ${formulaMl}ml", com.babyday.app.ui.theme.FormulaBg, com.babyday.app.ui.theme.FormulaColor)
        if (feedCount > 0) SummaryChip("🤱 ${feedCount}회", com.babyday.app.ui.theme.BreastBg, com.babyday.app.ui.theme.BreastColor)
        if (diaperCount > 0) SummaryChip("💧 ${diaperCount}회", com.babyday.app.ui.theme.DiaperBg, com.babyday.app.ui.theme.DiaperColor)
        if (bathCount > 0) SummaryChip("🛁 ${bathCount}회", com.babyday.app.ui.theme.BathBg, com.babyday.app.ui.theme.BathColor)
    }
    HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.4f))
}

@Composable
private fun LastActivityCards(records: List<BabyRecord>) {
    data class ActivityItem(
        val title: String, val elapsed: String, val detail: String,
        val bg: Color, val fg: Color
    )
    val items = buildList {
        records.filter { it.type == "diaper" }.maxByOrNull { it.startTime }?.let { r ->
            val detail = when (r.diaperKind) {
                "stool" -> "💩 대변"
                "both"  -> "💧💩 둘다"
                else    -> "💧 소변"
            }
            add(ActivityItem("마지막 기저귀", DateUtils.elapsed(r.startTime), detail, DiaperBg, DiaperColor))
        }
        records.filter { it.type == "formula" }.maxByOrNull { it.startTime }?.let { r ->
            add(ActivityItem("마지막 분유", DateUtils.elapsed(r.startTime), "${r.ml ?: 0}ml", FormulaBg, FormulaColor))
        }
        records.filter { it.type == "breast" }.maxByOrNull { it.startTime }?.let { r ->
            val total = (r.leftMin ?: 0) + (r.rightMin ?: 0)
            val detail = if ((r.leftMin ?: 0) > 0) "왼쪽 ${r.leftMin}분 · 총 ${total}분" else "총 ${total}분"
            add(ActivityItem("마지막 모유", DateUtils.elapsed(r.startTime), detail, BreastBg, BreastColor))
        }
    }
    if (items.isEmpty()) return

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items.forEach { item ->
            Card(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = item.bg),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
            ) {
                Column(modifier = Modifier.padding(10.dp)) {
                    Text(item.title, fontSize = 10.sp, color = item.fg.copy(alpha = 0.7f))
                    Spacer(Modifier.height(2.dp))
                    Text(item.elapsed, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = item.fg)
                    Text(item.detail, fontSize = 10.sp, color = item.fg.copy(alpha = 0.8f))
                }
            }
        }
    }
    HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.4f))
}

@Composable
private fun SummaryChip(text: String, bg: Color, fg: Color) {
    Box(
        modifier = Modifier
            .background(bg, RoundedCornerShape(22.dp))
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Text(text = text, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = fg)
    }
}
