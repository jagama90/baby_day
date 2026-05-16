package com.babyday.app.ui.screens.log.components

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.babyday.app.ui.theme.BreastColor
import com.babyday.app.ui.theme.Primary

@Composable
fun VoiceInputButton(
    onResult: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val isRecognitionAvailable = remember {
        SpeechRecognizer.isRecognitionAvailable(context)
    }
    var isListening by remember { mutableStateOf(false) }
    var recognizer by remember { mutableStateOf<SpeechRecognizer?>(null) }

    val permLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            startListening(
                context, recognizer,
                onStart = { isListening = true },
                onResult = { txt -> isListening = false; onResult(txt) },
                onError = { isListening = false }
            )
        }
    }

    DisposableEffect(Unit) {
        if (isRecognitionAvailable) {
            recognizer = SpeechRecognizer.createSpeechRecognizer(context)
        }
        onDispose {
            recognizer?.destroy()
            recognizer = null
        }
    }

    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 0.6f,
        animationSpec = infiniteRepeatable(tween(800), RepeatMode.Reverse),
        label = "alpha"
    )

    Button(
        onClick = {
            if (!isRecognitionAvailable) return@Button
            if (isListening) {
                recognizer?.stopListening()
                isListening = false
                return@Button
            }
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO)
                == PackageManager.PERMISSION_GRANTED
            ) {
                startListening(
                    context, recognizer,
                    onStart = { isListening = true },
                    onResult = { txt -> isListening = false; onResult(txt) },
                    onError = { isListening = false }
                )
            } else {
                permLauncher.launch(Manifest.permission.RECORD_AUDIO)
            }
        },
        enabled = isRecognitionAvailable,
        modifier = modifier.fillMaxWidth().height(56.dp),
        shape = RoundedCornerShape(18.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = if (isListening) BreastColor else Primary
        )
    ) {
        Text(
            text = when {
                !isRecognitionAvailable -> "음성 입력 미지원"
                isListening -> "🔴 듣는 중..."
                else -> "🎙 음성 입력"
            },
            fontSize = 17.sp, fontWeight = FontWeight.ExtraBold,
            color = Color.White.copy(alpha = if (isListening) alpha else 1f)
        )
    }
}

private fun startListening(
    context: android.content.Context,
    recognizer: SpeechRecognizer?,
    onStart: () -> Unit,
    onResult: (String) -> Unit,
    onError: () -> Unit
) {
    val sr = recognizer ?: return
    sr.setRecognitionListener(object : RecognitionListener {
        override fun onReadyForSpeech(p: Bundle?) = onStart()
        override fun onResults(results: Bundle?) {
            val txt = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                ?.firstOrNull() ?: ""
            onResult(txt)
        }
        override fun onError(error: Int) = onError()
        override fun onBeginningOfSpeech() {}
        override fun onRmsChanged(v: Float) {}
        override fun onBufferReceived(b: ByteArray?) {}
        override fun onEndOfSpeech() {}
        override fun onPartialResults(p: Bundle?) {}
        override fun onEvent(t: Int, p: Bundle?) {}
    })
    val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
        putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ko-KR")
        putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
    }
    sr.startListening(intent)
}
