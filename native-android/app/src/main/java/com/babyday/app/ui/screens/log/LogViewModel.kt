package com.babyday.app.ui.screens.log

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.babyday.app.data.model.BabyMember
import com.babyday.app.data.model.BabyRecord
import com.babyday.app.BabyDayApp
import com.babyday.app.data.local.SettingsDataStore
import com.babyday.app.data.remote.SupabaseClientProvider
import com.babyday.app.data.repository.AuthRepository
import com.babyday.app.data.repository.BabyRepository
import com.babyday.app.data.repository.LogRepository
import com.babyday.app.data.repository.LogRepository.LogFetchResult
import com.babyday.app.domain.ComputePatternMessagesUseCase
import com.babyday.app.domain.PatternMessage
import com.babyday.app.ui.AppState
import com.babyday.app.util.DateUtils
import com.babyday.app.util.LogUtils
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

private val isoFormatter = DateTimeFormatter.ISO_OFFSET_DATE_TIME

private fun nowIso(): String {
    return OffsetDateTime.now(ZoneId.systemDefault()).format(isoFormatter)
}

class LogViewModel : ViewModel() {

    private val logRepo  = LogRepository()
    private val babyRepo = BabyRepository()
    private val authRepo = AuthRepository()
    private val computePatternMessagesUseCase = ComputePatternMessagesUseCase()
    private val settingsDataStore = SettingsDataStore(BabyDayApp.instance)

    private val _records = MutableStateFlow<List<BabyRecord>>(emptyList())
    val records: StateFlow<List<BabyRecord>> = _records

    private val _babies = MutableStateFlow<List<BabyMember>>(emptyList())
    val babies: StateFlow<List<BabyMember>> = _babies

    private val _currentBabyId = MutableStateFlow<String?>(null)
    val currentBabyId: StateFlow<String?> = _currentBabyId

    private val _syncState = MutableStateFlow(SyncState.LOADING)
    val syncState: StateFlow<SyncState> = _syncState

    private val _toast = MutableStateFlow<String?>(null)
    val toast: StateFlow<String?> = _toast

    private val _darkMode = MutableStateFlow(false)
    val darkMode: StateFlow<Boolean> = _darkMode

    private val _patternMessages = MutableStateFlow<List<PatternMessage>>(emptyList())
    val patternMessages: StateFlow<List<PatternMessage>> = _patternMessages

    enum class SyncState { CONNECTED, DISCONNECTED, LOADING }

    init {
        viewModelScope.launch {
            runCatching {
                val prefs = settingsDataStore.settings.first()
                val saved = prefs["dark_mode"] == "1"
                _darkMode.value = saved
                AppState.setDarkMode(saved)
            }
        }
    }

    fun initialize(initialBabyId: String?) {
        viewModelScope.launch {
            val userId = SupabaseClientProvider.client.auth.currentUserOrNull()?.id ?: return@launch
            runCatching { babyRepo.getBabiesForUser(userId) }
                .onSuccess { members ->
                    _babies.value = members
                    val targetId = initialBabyId ?: members.firstOrNull()?.babyId
                    targetId?.let { selectBaby(it) }
                }
                .onFailure { _syncState.value = SyncState.DISCONNECTED }
        }
    }

    fun selectBaby(babyId: String) {
        _currentBabyId.value = babyId
        loadLogs(babyId)
    }

    fun loadLogs(babyId: String) {
        viewModelScope.launch {
            _syncState.value = SyncState.LOADING
            when (val result = logRepo.getLogs(babyId)) {
                is LogFetchResult.Fresh -> {
                    _records.value = result.data
                    _syncState.value = SyncState.CONNECTED
                    computePatterns()
                }
                is LogFetchResult.Cached -> {
                    _records.value = result.data
                    _syncState.value = SyncState.DISCONNECTED
                    showToast("오프라인 캐시 표시 중")
                    computePatterns()
                }
            }
        }
    }

    fun showToast(msg: String) { _toast.value = msg }
    fun clearToast() { _toast.value = null }

    fun setDarkMode(on: Boolean) {
        _darkMode.value = on
        AppState.setDarkMode(on)
        viewModelScope.launch {
            settingsDataStore.save(SettingsDataStore.DARK_MODE, if (on) "1" else "0")
        }
    }

    suspend fun signOut() = authRepo.signOut()

    // ─── CRUD ─────────────────────────────────────────────────────────────────

    fun quickAdd(type: String, diaperKind: String? = null) {
        val babyId = _currentBabyId.value ?: run { showToast("아기를 먼저 등록해주세요"); return }
        val userId = SupabaseClientProvider.client.auth.currentUserOrNull()?.id ?: return
        viewModelScope.launch {
            val now = java.util.Date()
            val iso = nowIso()
            val ds  = DateUtils.fmtDate(now)
            if (type == "sleep") {
                val ongoing = _records.value.find { it.type == "sleep" && it.endTime == null }
                if (ongoing != null) {
                    runCatching { logRepo.updateLog(ongoing.id, mapOf("end_time" to iso)) }
                        .onSuccess { showToast("수면 종료 · ${DateUtils.durLabel(DateUtils.durMin(ongoing.startTime, iso))}") }
                        .onFailure { showToast("오류: ${it.message}") }
                    loadLogs(babyId); return@launch
                }
            }
            val rec = mutableMapOf<String, Any?>(
                "type" to type, "date" to ds, "start_time" to iso,
                "baby_id" to babyId, "user_id" to userId
            )
            if (type == "sleep") {
                val h = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
                rec["sleep_kind"] = if (h in 6..18) "nap" else "night"
            }
            if (type == "diaper") rec["diaper_kind"] = diaperKind ?: "urine"
            runCatching { logRepo.createLog(rec) }
                .onSuccess { showToast("${LogUtils.EMOJI[type] ?: ""} ${LogUtils.LABEL[type] ?: type} 기록됨") }
                .onFailure { showToast("오류: ${it.message}") }
            loadLogs(babyId)
        }
    }

    fun deleteRecord(id: String) {
        viewModelScope.launch {
            runCatching { logRepo.deleteLog(id) }
                .onSuccess { _records.value = _records.value.filter { it.id != id }; showToast("삭제됨") }
                .onFailure { showToast("DB 삭제 정책 확인 전까지 아기 삭제는 비활성화되어 있어요") }
        }
    }

    fun saveFormulaRecord(babyId: String, ds: String, startTime: String, ml: Int) {
        val userId = SupabaseClientProvider.client.auth.currentUserOrNull()?.id ?: return
        viewModelScope.launch {
            val iso = "${ds}T${startTime}:00+09:00"
            val rec = mapOf("type" to "formula", "date" to ds, "start_time" to iso, "ml" to ml, "baby_id" to babyId, "user_id" to userId)
            runCatching { logRepo.createLog(rec) }
                .onSuccess { showToast("🍼 분유 저장됨"); loadLogs(babyId) }
                .onFailure { showToast("저장 실패") }
        }
    }

    fun saveBreastRecord(babyId: String, ds: String, startTime: String, leftMin: Int, rightMin: Int) {
        val userId = SupabaseClientProvider.client.auth.currentUserOrNull()?.id ?: return
        viewModelScope.launch {
            val iso = "${ds}T${startTime}:00+09:00"
            val rec = mapOf("type" to "breast", "date" to ds, "start_time" to iso, "left_min" to leftMin, "right_min" to rightMin, "baby_id" to babyId, "user_id" to userId)
            runCatching { logRepo.createLog(rec) }
                .onSuccess { showToast("🤱 모유 저장됨"); loadLogs(babyId) }
                .onFailure { showToast("저장 실패") }
        }
    }

    fun saveDiaperRecord(babyId: String, ds: String, startTime: String, kind: String) {
        val userId = SupabaseClientProvider.client.auth.currentUserOrNull()?.id ?: return
        viewModelScope.launch {
            val iso = "${ds}T${startTime}:00+09:00"
            val rec = mapOf("type" to "diaper", "date" to ds, "start_time" to iso, "diaper_kind" to kind, "baby_id" to babyId, "user_id" to userId)
            runCatching { logRepo.createLog(rec) }
                .onSuccess { showToast("기저귀 저장됨"); loadLogs(babyId) }
                .onFailure { showToast("저장 실패") }
        }
    }

    fun saveSleepRecord(babyId: String, ds: String, startTime: String, endTime: String?, sleepKind: String) {
        val userId = SupabaseClientProvider.client.auth.currentUserOrNull()?.id ?: return
        viewModelScope.launch {
            val startIso = "${ds}T${startTime}:00+09:00"
            val rec = mutableMapOf<String, Any?>("type" to "sleep", "date" to ds, "start_time" to startIso, "sleep_kind" to sleepKind, "baby_id" to babyId, "user_id" to userId)
            if (!endTime.isNullOrEmpty()) rec["end_time"] = "${ds}T${endTime}:00+09:00"
            runCatching { logRepo.createLog(rec) }
                .onSuccess { showToast("😴 수면 저장됨"); loadLogs(babyId) }
                .onFailure { showToast("저장 실패") }
        }
    }

    fun saveGrowthRecord(babyId: String, date: String, weight: Double?, height: Double?, head: Double?, memo: String?) {
        val userId = SupabaseClientProvider.client.auth.currentUserOrNull()?.id ?: return
        viewModelScope.launch {
            val rec = mutableMapOf<String, Any?>("type" to "growth", "date" to date, "start_time" to "${date}T09:00:00+09:00", "baby_id" to babyId, "user_id" to userId)
            weight?.let { rec["weight"] = it }; height?.let { rec["height"] = it }; head?.let { rec["head"] = it }; memo?.let { if (it.isNotEmpty()) rec["memo"] = it }
            runCatching { logRepo.createLog(rec) }
                .onSuccess { showToast("📏 성장 기록 저장됨"); loadLogs(babyId) }
                .onFailure { showToast("저장 실패") }
        }
    }

    fun saveHospitalRecord(babyId: String, date: String, name: String, type: String, vaccine: String?, memo: String?) {
        val userId = SupabaseClientProvider.client.auth.currentUserOrNull()?.id ?: return
        viewModelScope.launch {
            val rec = mutableMapOf<String, Any?>("type" to "hospital", "date" to date, "start_time" to "${date}T09:00:00+09:00", "hospital_name" to name, "hospital_type" to type, "baby_id" to babyId, "user_id" to userId)
            if (!vaccine.isNullOrEmpty()) rec["vaccine_name"] = vaccine
            if (!memo.isNullOrEmpty()) rec["memo"] = memo
            runCatching { logRepo.createLog(rec) }
                .onSuccess { showToast("🏥 병원 기록 저장됨"); loadLogs(babyId) }
                .onFailure { showToast("저장 실패") }
        }
    }

    fun updateFormulaRecord(record: BabyRecord, ml: Int, startTime: String) {
        viewModelScope.launch {
            val iso = "${record.date}T${startTime}:00+09:00"
            runCatching { logRepo.updateLog(record.id, mapOf("ml" to ml, "start_time" to iso)) }
                .onSuccess { r -> _records.value = _records.value.map { if (it.id == r.id) r else it }; showToast("🍼 분유 수정됨") }
                .onFailure { showToast("저장 실패") }
        }
    }

    fun updateBreastRecord(record: BabyRecord, leftMin: Int, rightMin: Int, startTime: String) {
        viewModelScope.launch {
            val iso = "${record.date}T${startTime}:00+09:00"
            runCatching { logRepo.updateLog(record.id, mapOf("left_min" to leftMin, "right_min" to rightMin, "start_time" to iso)) }
                .onSuccess { r -> _records.value = _records.value.map { if (it.id == r.id) r else it }; showToast("🤱 모유 수정됨") }
                .onFailure { showToast("저장 실패") }
        }
    }

    fun updateDiaperRecord(record: BabyRecord, kind: String, startTime: String) {
        viewModelScope.launch {
            val iso = "${record.date}T${startTime}:00+09:00"
            runCatching { logRepo.updateLog(record.id, mapOf("diaper_kind" to kind, "start_time" to iso)) }
                .onSuccess { r -> _records.value = _records.value.map { if (it.id == r.id) r else it }; showToast("기저귀 수정됨") }
                .onFailure { showToast("저장 실패") }
        }
    }

    fun updateSleepRecord(record: BabyRecord, startTime: String, endTime: String?) {
        viewModelScope.launch {
            val newStart = "${record.date}T${startTime}:00+09:00"
            val patch = mutableMapOf<String, Any?>("start_time" to newStart)
            if (!endTime.isNullOrEmpty()) {
                val startM = startTime.split(":").let { it[0].toInt() * 60 + it[1].toInt() }
                val endM   = endTime.split(":").let { it[0].toInt() * 60 + it[1].toInt() }
                val endDate = if (endM < startM) {
                    val cal = java.util.Calendar.getInstance().apply {
                        time = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).parse(record.date)!!
                        add(java.util.Calendar.DAY_OF_MONTH, 1)
                    }
                    DateUtils.fmtDate(cal.time)
                } else record.date
                patch["end_time"] = "${endDate}T${endTime}:00+09:00"
            } else patch["end_time"] = null
            runCatching { logRepo.updateLog(record.id, patch) }
                .onSuccess { r -> _records.value = _records.value.map { if (it.id == r.id) r else it }; showToast("😴 수면 수정됨") }
                .onFailure { showToast("저장 실패") }
        }
    }

    // ─── BABY MANAGEMENT ──────────────────────────────────────────────────────

    fun addBaby(name: String, birthDate: String, gender: String, onDone: (String) -> Unit = {}) {
        val userId = SupabaseClientProvider.client.auth.currentUserOrNull()?.id ?: return
        viewModelScope.launch {
            runCatching { babyRepo.createBaby(name, birthDate, gender, userId) }
                .onSuccess { baby ->
                    val uid = SupabaseClientProvider.client.auth.currentUserOrNull()?.id ?: return@onSuccess
                    _babies.value = babyRepo.getBabiesForUser(uid)
                    selectBaby(baby.id)
                    showToast("아기 등록 완료")
                    onDone(baby.id)
                }
                .onFailure { showToast("등록 실패: ${it.message}") }
        }
    }

    fun updateBaby(babyId: String, fields: Map<String, Any?>) {
        viewModelScope.launch {
            runCatching { babyRepo.updateBaby(babyId, fields) }
                .onSuccess {
                    val userId = SupabaseClientProvider.client.auth.currentUserOrNull()?.id ?: return@onSuccess
                    _babies.value = babyRepo.getBabiesForUser(userId)
                    showToast("저장됨 ✅")
                }
                .onFailure { showToast("저장 실패") }
        }
    }

    fun deleteBaby(babyId: String) {
        val userId = SupabaseClientProvider.client.auth.currentUserOrNull()?.id ?: return
        viewModelScope.launch {
            runCatching { babyRepo.deleteBaby(babyId, userId) }
                .onSuccess {
                    _babies.value = _babies.value.filter { it.babyId != babyId }
                    if (_currentBabyId.value == babyId) {
                        val next = _babies.value.firstOrNull()?.babyId
                        _currentBabyId.value = next
                        if (next != null) loadLogs(next) else _records.value = emptyList()
                    }
                    showToast("삭제됨")
                }
                .onFailure { showToast("삭제 실패") }
        }
    }

    suspend fun generateInviteCode(babyId: String): String {
        val userId = SupabaseClientProvider.client.auth.currentUserOrNull()?.id ?: return ""
        return runCatching { babyRepo.generateInviteCode(babyId, userId) }.getOrElse { "" }
    }

    fun joinByInviteCode(code: String) {
        val userId = SupabaseClientProvider.client.auth.currentUserOrNull()?.id ?: return
        viewModelScope.launch {
            runCatching { babyRepo.joinByInviteCode(code.uppercase().trim(), userId) }
                .onSuccess { ok ->
                    if (ok) {
                        _babies.value = babyRepo.getBabiesForUser(userId)
                        showToast("가족에 참여했어요 🎉")
                    } else showToast("코드를 찾을 수 없어요")
                }
                .onFailure { showToast("입력 실패: ${it.message}") }
        }
    }

    // ─── VOICE ────────────────────────────────────────────────────────────────

    fun handleVoice(text: String) {
        val babyId = _currentBabyId.value ?: run { showToast("아기를 먼저 등록해주세요"); return }
        val userId = SupabaseClientProvider.client.auth.currentUserOrNull()?.id ?: return
        viewModelScope.launch {
            val now = java.util.Date()
            val iso = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss+09:00", java.util.Locale.getDefault()).format(now)
            val ds  = DateUtils.fmtDate(now)
            val base = mapOf("baby_id" to babyId, "user_id" to userId)
            when {
                Regex("삭제|취소|지워|잘못").containsMatchIn(text) -> {
                    val last = _records.value.maxByOrNull { it.startTime }
                    if (last != null) {
                        logRepo.deleteLog(last.id)
                        _records.value = _records.value.filter { it.id != last.id }
                        showToast("🗑 방금 기록 삭제됨 (${LogUtils.LABEL[last.type] ?: last.type})")
                    } else showToast("삭제할 기록이 없어요")
                }
                Regex("수면\\s*끝|잠\\s*깼|기상|일어났").containsMatchIn(text) -> {
                    val ongoing = _records.value.find { it.type == "sleep" && it.endTime == null }
                    if (ongoing != null) {
                        logRepo.updateLog(ongoing.id, mapOf("end_time" to iso))
                        loadLogs(babyId); showToast("수면 종료")
                    } else showToast("진행 중인 수면이 없어요")
                }
                Regex("수면|잠|낮잠|밤잠").containsMatchIn(text) -> {
                    val kind = if (text.contains("밤잠")) "night" else {
                        val h = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
                        if (h in 6..18) "nap" else "night"
                    }
                    logRepo.createLog(base + mapOf("type" to "sleep", "date" to ds, "start_time" to iso, "sleep_kind" to kind))
                    loadLogs(babyId); showToast("😴 ${if (kind == "nap") "낮잠" else "밤잠"} 시작")
                }
                Regex("기저귀|소변|대변").containsMatchIn(text) -> {
                    val kind = if (text.contains("대변") && text.contains("소변")) "both"
                               else if (text.contains("대변")) "stool" else "urine"
                    logRepo.createLog(base + mapOf("type" to "diaper", "date" to ds, "start_time" to iso, "diaper_kind" to kind))
                    loadLogs(babyId); showToast("기저귀 기록됨")
                }
                Regex("분유").containsMatchIn(text) -> {
                    val ml = Regex("(\\d+)").find(text)?.value?.toIntOrNull() ?: 0
                    logRepo.createLog(base + mapOf("type" to "formula", "date" to ds, "start_time" to iso, "ml" to ml))
                    loadLogs(babyId); showToast("🍼 분유 ${ml}ml 기록됨")
                }
                Regex("목욕").containsMatchIn(text) -> {
                    logRepo.createLog(base + mapOf("type" to "bath", "date" to ds, "start_time" to iso))
                    loadLogs(babyId); showToast("🛁 목욕 기록됨")
                }
                Regex("모유|수유").containsMatchIn(text) -> {
                    val lm = Regex("왼(쪽)?\\s*(\\d+)").find(text)?.groupValues?.get(2)?.toIntOrNull() ?: 0
                    val rm = Regex("오른(쪽)?\\s*(\\d+)").find(text)?.groupValues?.get(2)?.toIntOrNull() ?: 0
                    val tm = Regex("(\\d+)\\s*분").find(text)?.groupValues?.get(1)?.toIntOrNull() ?: 0
                    val l = if (lm == 0 && rm == 0) tm else lm
                    logRepo.createLog(base + mapOf("type" to "breast", "date" to ds, "start_time" to iso, "left_min" to l, "right_min" to rm))
                    loadLogs(babyId); showToast("🤱 모유 기록됨")
                }
                else -> showToast("\"$text\" — 인식 실패")
            }
        }
    }

    // ─── PATTERN PREDICTION ───────────────────────────────────────────────────

    fun refreshPatterns() { computePatterns() }

    private fun computePatterns() {
        _patternMessages.value = computePatternMessagesUseCase(_records.value)
    }
}
