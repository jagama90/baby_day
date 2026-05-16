import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.ksp)
    // NOTE: requires google-services.json in app/ directory
    // alias(libs.plugins.google.services)
}

val localProps = Properties().apply {
    val f = rootProject.file("local.properties")
    if (f.exists()) load(f.inputStream())
}

android {
    namespace = "com.babyday.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.babyday.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        buildConfigField(
            "String", "SUPABASE_URL",
            "\"${localProps["supabase.url"] ?: ""}\""
        )
        buildConfigField(
            "String", "SUPABASE_ANON_KEY",
            "\"${localProps["supabase.anon_key"] ?: ""}\""
        )

        val kakaoKey = localProps["kakao.native_app_key"] as? String ?: ""
        buildConfigField("String", "KAKAO_NATIVE_APP_KEY", "\"$kakaoKey\"")
        manifestPlaceholders["kakaoNativeAppKey"] = kakaoKey

        manifestPlaceholders["authRedirectScheme"] = "babyday"
        manifestPlaceholders["authRedirectHost"] = "auth"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = "11"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.activity.compose)

    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.graphics)
    implementation(libs.compose.ui.tooling.preview)
    implementation(libs.compose.material3)
    implementation(libs.compose.material.icons)
    debugImplementation(libs.compose.ui.tooling)

    implementation(libs.navigation.compose)

    implementation(platform(libs.supabase.bom))
    implementation(libs.supabase.postgrest)
    implementation(libs.supabase.auth)
    implementation(libs.supabase.realtime)

    implementation(libs.ktor.client.android)
    implementation(libs.datastore.preferences)
    implementation(libs.androidx.browser)
    implementation(libs.kotlinx.coroutines.android)

    implementation(libs.kakao.user)
    implementation(libs.room.runtime)
    implementation(libs.room.ktx)
    ksp(libs.room.compiler)

    // Firebase (requires google-services.json)
    // implementation(platform("com.google.firebase:firebase-bom:33.14.0"))
    // implementation("com.google.firebase:firebase-messaging-ktx")

    implementation("androidx.core:core-splashscreen:1.0.1")
}
