package com.babyday.app.ui.screens.log.components.sheets

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.babyday.app.ui.theme.Primary
import com.babyday.app.util.DateUtils

@Composable
fun TimeAdjuster(
    time: String,
    onTimeChange: (String) -> Unit,
    color: androidx.compose.ui.graphics.Color = Primary
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.background, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Text(
            text = DateUtils.toAmPm(time),
            fontSize = 28.sp, fontWeight = FontWeight.Black,
            color = color, modifier = Modifier.align(Alignment.CenterHorizontally)
        )
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(5.dp)) {
            listOf(-60, -10, -1, 1, 10, 60).forEach { delta ->
                val label = when {
                    delta <= -60 -> "-1H"
                    delta >= 60  -> "+1H"
                    delta > 0    -> "+${delta}분"
                    else         -> "${delta}분"
                }
                OutlinedButton(
                    onClick = { onTimeChange(adjustTime(time, delta)) },
                    modifier = Modifier.weight(1f).height(40.dp),
                    contentPadding = PaddingValues(0.dp)
                ) { Text(label, fontSize = 11.sp) }
            }
        }
    }
}

fun adjustTime(hhmm: String, diffMin: Int): String {
    val parts = hhmm.split(":").map { it.toIntOrNull() ?: 0 }
    val h = parts[0]; val m = parts.getOrElse(1) { 0 }
    val total = h * 60 + m + diffMin
    val nh = ((total / 60) % 24 + 24) % 24
    val nm = ((total % 60) + 60) % 60
    return "${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}"
}
