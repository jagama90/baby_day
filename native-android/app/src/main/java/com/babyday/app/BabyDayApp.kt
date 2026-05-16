package com.babyday.app

import android.app.Application
import com.babyday.app.data.local.db.BabyDayDatabase
import com.babyday.app.data.remote.SupabaseClientProvider
import com.kakao.sdk.common.KakaoSdk

class BabyDayApp : Application() {

    companion object {
        lateinit var instance: BabyDayApp
            private set
    }

    lateinit var database: BabyDayDatabase
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this
        SupabaseClientProvider.init(this)
        if (BuildConfig.KAKAO_NATIVE_APP_KEY.isNotEmpty()) {
            KakaoSdk.init(this, BuildConfig.KAKAO_NATIVE_APP_KEY)
        }
        database = BabyDayDatabase.getInstance(this)
    }
}
