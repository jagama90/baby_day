package com.babyday.app.data.local.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(entities = [BabyRecordEntity::class], version = 1, exportSchema = false)
abstract class BabyDayDatabase : RoomDatabase() {
    abstract fun babyRecordDao(): BabyRecordDao

    companion object {
        @Volatile private var INSTANCE: BabyDayDatabase? = null
        fun getInstance(context: Context): BabyDayDatabase {
            return INSTANCE ?: synchronized(this) {
                Room.databaseBuilder(context.applicationContext, BabyDayDatabase::class.java, "babyday.db")
                    .build().also { INSTANCE = it }
            }
        }
    }
}
