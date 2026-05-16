package com.babyday.app.ui.screens.log.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.babyday.app.data.model.BabyRecord
import com.babyday.app.ui.theme.*
import com.babyday.app.util.DateUtils
import com.babyday.app.util.LogUtils

private fun typeColor(type: String): Color = when (type) {
    "sleep"    -> SleepColor
    "formula"  -> FormulaColor
    "breast"   -> BreastColor
    "diaper"   -> DiaperColor
    "growth"   -> GrowthColor
    "hospital" -> HospitalColor
    "bath"     -> BathColor
    else       -> Primary
}

private fun typeBg(type: String): Color = when (type) {
    "sleep"    -> SleepBg
    "formula"  -> FormulaBg
    "breast"   -> BreastBg
    "diaper"   -> DiaperBg
    "growth"   -> GrowthBg
    "hospital" -> HospitalBg
    "bath"     -> BathBg
    else       -> PrimaryLight
}

@Composable
fun LogCard(
    record: BabyRecord,
    sleepTimerLabel: String? = null,
    roleLabel: String? = null,
    onClick: (() -> Unit)? = null,
    onDelete: () -> Unit = {}
) {
    val emoji = if (record.type == "diaper") LogUtils.diaperEmoji(record.diaperKind) else (LogUtils.EMOJI[record.type] ?: "")
    val label = LogUtils.LABEL[record.type] ?: record.type
    val color = typeColor(record.type)
    val bg    = typeBg(record.type)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 5.dp)
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp, 14.dp, 14.dp, if (roleLabel != null) 8.dp else 14.dp)) {
            Row(
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                // Icon
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .background(bg, RoundedCornerShape(14.dp)),
                    contentAlignment = Alignment.Center
                ) { Text(text = emoji, fontSize = 20.sp) }

                Spacer(modifier = Modifier.width(12.dp))

                // Body
                Column(modifier = Modifier.weight(1f)) {
                    val typeLabel = label + if (record.type == "sleep" && record.sleepKind != null)
                        " · ${if (record.sleepKind == "nap") "낮잠" else "밤잠"}" else ""
                    Text(text = typeLabel, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = color)
                    Spacer(modifier = Modifier.height(2.dp))
                    if (record.type == "formula") {
                        Text(text = "${record.ml ?: 0}ml", fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = FormulaColor)
                    } else {
                        Text(text = LogUtils.detail(record), fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                    }
                    sleepTimerLabel?.let {
                        Text(text = it, fontSize = 11.sp, color = SleepColor, fontWeight = FontWeight.Bold)
                    }
                    record.memo?.let { memo ->
                        Text(text = "📝 $memo", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontStyle = androidx.compose.ui.text.font.FontStyle.Italic)
                    }
                }

                // Time + delete
                Column(horizontalAlignment = Alignment.End) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(text = DateUtils.fmtTime(record.startTime), fontWeight = FontWeight.Bold, fontSize = 17.sp)
                        TextButton(
                            onClick = onDelete,
                            contentPadding = PaddingValues(0.dp),
                            modifier = Modifier.size(28.dp)
                        ) { Text(text = "×", fontSize = 18.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)) }
                    }
                    record.endTime?.let {
                        Text(text = "~ ${DateUtils.fmtTime(it)}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f))
                    }
                }
            }

            // Role label
            roleLabel?.let {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = it,
                    fontSize = 11.sp,
                    color = if (it.contains("엄마")) BreastColor.copy(alpha = 0.7f) else Primary.copy(alpha = 0.7f),
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.fillMaxWidth(),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )
            }
        }
    }
}
