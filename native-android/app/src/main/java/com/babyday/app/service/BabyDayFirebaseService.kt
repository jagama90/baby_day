package com.babyday.app.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import com.babyday.app.MainActivity
// NOTE: Firebase messaging is currently disabled. Enable by uncommenting Firebase deps in build.gradle.kts
// import com.google.firebase.messaging.FirebaseMessagingService
// import com.google.firebase.messaging.RemoteMessage

// Stub service — activate once google-services.json is added and Firebase deps are uncommented
// class BabyDayFirebaseService : FirebaseMessagingService() {
class BabyDayFirebaseService : android.app.Service() {

    companion object {
        const val CHANNEL_ID = "babyday_alerts"

        fun showNotification(context: Context, title: String, body: String) {
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(
                NotificationChannel(CHANNEL_ID, "아기 알림", NotificationManager.IMPORTANCE_HIGH)
            )
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pi = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_IMMUTABLE)
            val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(true)
                .setContentIntent(pi)
                .build()
            manager.notify(System.currentTimeMillis().toInt(), notification)
        }
    }

    override fun onBind(intent: android.content.Intent?) = null
}
