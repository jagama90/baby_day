package com.babyday.app.data.remote

import android.content.Context
import com.babyday.app.BuildConfig
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.ExternalAuthAction
import io.github.jan.supabase.auth.FlowType
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.realtime.Realtime

object SupabaseClientProvider {

    const val AUTH_REDIRECT_URL = "babyday://auth/callback"

    lateinit var client: SupabaseClient
        private set

    var configurationError: String? = null
        private set

    val isConfigured: Boolean
        get() = ::client.isInitialized && configurationError == null

    fun init(context: Context) {
        val supabaseUrl = BuildConfig.SUPABASE_URL.trim()
        val supabaseAnonKey = BuildConfig.SUPABASE_ANON_KEY.trim()
        if (supabaseUrl.isEmpty() || supabaseAnonKey.isEmpty()) {
            configurationError = "Supabase URL 또는 anon key가 native-android/local.properties에 설정되지 않았습니다."
            return
        }

        client = createSupabaseClient(
            supabaseUrl = supabaseUrl,
            supabaseKey = supabaseAnonKey
        ) {
            install(Auth) {
                scheme = "babyday"
                host = "auth"
                defaultRedirectUrl = AUTH_REDIRECT_URL
                flowType = FlowType.PKCE
                defaultExternalAuthAction = ExternalAuthAction.CustomTabs {
                    setShowTitle(false)
                }
            }
            install(Postgrest)
            install(Realtime)
        }
        configurationError = null
    }
}
