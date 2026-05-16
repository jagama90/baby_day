package com.babyday.app.ui.screens.log.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.babyday.app.ui.theme.*

data class QuickAction(val emoji: String, val label: String, val bg: Color, val onClick: () -> Unit)

@Composable
fun QuickButtons(
    onSleep: () -> Unit,
    onFormula: () -> Unit,
    onBreast: () -> Unit,
    onDiaperUrine: () -> Unit,
    onDiaperStool: () -> Unit,
    onDiaperBoth: () -> Unit,
    onBath: () -> Unit,
    isSleepOngoing: Boolean = false
) {
    val actions = listOf(
        QuickAction(if (isSleepOngoing) "⏹" else "😴", if (isSleepOngoing) "수면끝" else "수면", SleepBg, onSleep),
        QuickAction("🍼", "분유", FormulaBg, onFormula),
        QuickAction("🤱", "모유", BreastBg, onBreast),
        QuickAction("💧", "소변", DiaperBg, onDiaperUrine),
        QuickAction("💩", "대변", DiaperBg, onDiaperStool),
        QuickAction("🚿", "둘다", DiaperBg, onDiaperBoth),
        QuickAction("🛁", "목욕", BathBg, onBath),
    )
    Surface(shadowElevation = 1.dp) {
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(actions.size) { i ->
                val a = actions[i]
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier
                        .width(56.dp)
                        .clickable(onClick = a.onClick)
                ) {
                    Box(
                        modifier = Modifier
                            .size(52.dp)
                            .background(a.bg, RoundedCornerShape(16.dp)),
                        contentAlignment = Alignment.Center
                    ) { Text(a.emoji, fontSize = 24.sp) }
                    Spacer(Modifier.height(4.dp))
                    Text(
                        a.label, fontSize = 10.sp, fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        textAlign = TextAlign.Center, maxLines = 1
                    )
                }
            }
        }
    }
    HorizontalDivider()
}
