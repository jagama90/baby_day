package com.babyday.app.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "babyday_settings")

class SettingsDataStore(private val context: Context) {

    companion object {
        val BABY_NAME       = stringPreferencesKey("baby_name")
        val BABY_BIRTH      = stringPreferencesKey("baby_birth")
        val FORMULA_GOAL    = stringPreferencesKey("formula_goal")
        val FEED_WARN_HOUR  = stringPreferencesKey("feed_warn_hour")
        val DARK_MODE       = stringPreferencesKey("dark_mode")
        val PUSH_ENABLED    = stringPreferencesKey("push_enabled")
        val BABY_WEIGHT     = stringPreferencesKey("baby_weight")
        val AVG_FORMULA_ML  = stringPreferencesKey("avg_formula_ml")
        val LAST_BABY_ID    = stringPreferencesKey("last_baby_id")
    }

    val settings: Flow<Map<String, String>> = context.dataStore.data
        .map { prefs ->
            prefs.asMap().mapKeys { it.key.name }.mapValues { it.value.toString() }
        }

    val lastBabyId: Flow<String?> = context.dataStore.data
        .map { it[LAST_BABY_ID] }

    suspend fun saveLastBabyId(id: String) {
        context.dataStore.edit { it[LAST_BABY_ID] = id }
    }

    suspend fun save(key: Preferences.Key<String>, value: String) {
        context.dataStore.edit { it[key] = value }
    }
}
