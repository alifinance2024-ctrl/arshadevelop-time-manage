import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Code2, 
  FileCode, 
  FolderTree, 
  Terminal,
  Download
} from 'lucide-react';

interface AndroidCodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface KotlinFile {
  name: string;
  path: string;
  content: string;
}

const ANDROID_FILES: KotlinFile[] = [
  {
    name: 'TaskEntity.kt',
    path: 'app/src/main/java/com/hamrahman/app/data/database/TaskEntity.kt',
    content: `package com.hamrahman.app.data.database

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * دیتابیس محلی Room برای ذخیره‌سازی آفلاین تمام وظایف
 * سازگار با گوشی Xiaomi POCO M4 و نسخه اندروید API 26 به بالا
 */
@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey
    val id: String,
    val title: String,
    val description: String? = null,
    val category: String,
    val createdAt: Long = System.currentTimeMillis(),
    val dueDate: String, // فرمت شمسی استاندارد YYYY/MM/DD
    val dueTime: String? = null, // فرمت 24 ساعته HH:mm
    val estimatedDurationMinutes: Int = 30,
    val priority: String = "medium", // low, medium, high, urgent
    val status: String = "registered", // registered, scheduled, completed, overdue
    val recurrence: String = "none", // none, daily, weekly, monthly
    val finalDeadline: String? = null,
    val source: String = "voice", // voice, manual
    val isTimeFixed: Boolean = false
)`
  },
  {
    name: 'TaskDao.kt',
    path: 'app/src/main/java/com/hamrahman/app/data/database/TaskDao.kt',
    content: `package com.hamrahman.app.data.database

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface TaskDao {
    @Query("SELECT * FROM tasks ORDER BY dueDate ASC, dueTime ASC")
    fun getAllTasks(): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE dueDate = :jalaliDate ORDER BY dueTime ASC")
    fun getTasksByDate(jalaliDate: String): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE dueDate < :todayJalali AND status != 'completed'")
    fun getOverdueTasks(todayJalali: String): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE priority = 'urgent' AND status != 'completed'")
    fun getUrgentTasks(): Flow<List<TaskEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: TaskEntity)

    @Update
    suspend fun updateTask(task: TaskEntity)

    @Delete
    suspend fun deleteTask(task: TaskEntity)

    @Query("UPDATE tasks SET status = :status WHERE id = :taskId")
    suspend fun updateTaskStatus(taskId: String, status: String)

    @Query("UPDATE tasks SET dueDate = :newDate WHERE id IN (:taskIds)")
    suspend fun rolloverTasks(taskIds: List<String>, newDate: String)
}`
  },
  {
    name: 'AppDatabase.kt',
    path: 'app/src/main/java/com/hamrahman/app/data/database/AppDatabase.kt',
    content: `package com.hamrahman.app.data.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(entities = [TaskEntity::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun taskDao(): TaskDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "hamrah_man_database"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}`
  },
  {
    name: 'PersianTaskParser.kt',
    path: 'app/src/main/java/com/hamrahman/app/voice/task_parser/PersianTaskParser.kt',
    content: `package com.hamrahman.app.voice.task_parser

import java.util.regex.Pattern

data class ParsedTaskResult(
    val title: String,
    val category: String,
    val dueDate: String,
    val dueTime: String?,
    val durationMinutes: Int,
    val priority: String,
    val recurrence: String,
    val isTimeFixed: Boolean,
    val needsClarification: Boolean,
    val clarificationQuestion: String?
)

/**
 * موتور محلی پردازش زبان طبیعی فارسی برای استخراج ساختار وظیفه از گفتار
 */
class PersianTaskParser {
    fun parse(rawText: String, todayJalali: String): ParsedTaskResult {
        var cleanTitle = rawText.trim()
        var dueTime: String? = null
        var isTimeFixed = false
        var duration = 30
        var priority = "medium"
        var recurrence = "none"

        // بررسی زمان
        val timePattern = Pattern.compile("ساعت\\\\s*([0-2]?[0-9])(?::([0-5][0-9]))?")
        val matcher = timePattern.matcher(rawText)
        if (matcher.find()) {
            val h = matcher.group(1)?.toIntOrNull() ?: 9
            val m = matcher.group(2)?.toIntOrNull() ?: 0
            val hStr = if (h < 10) "0$h" else "$h"
            val mStr = if (m < 10) "0$m" else "$m"
            dueTime = "$hStr:$mStr"
            isTimeFixed = true
            cleanTitle = cleanTitle.replace(matcher.group(0), "")
        }

        // بررسی تکرار
        if (rawText.contains("هر روز") || rawText.contains("روزانه")) {
            recurrence = "daily"
        }

        // دسته‌بندی
        val category = when {
            rawText.contains("قرآن") || rawText.contains("مسابقه") -> "امور قرآنی و فرهنگی"
            rawText.contains("اداره") || rawText.contains("مدیر") || rawText.contains("نامه") -> "امور اداری"
            rawText.contains("هوش مصنوعی") || rawText.contains("یادگیری") -> "یادگیری و آموزش"
            rawText.contains("ورزش") || rawText.contains("پیاده‌روی") -> "ورزش و سلامتی"
            rawText.contains("بانک") || rawText.contains("قسط") -> "مالی و سرمایه‌گذاری"
            else -> "امور شخصی"
        }

        // حذف افعال پایانی گفتار
        cleanTitle = cleanTitle.replace(Regex("(بگیرم|کنم|بگذارم|ارسال کنم|آماده کنم)\\\\s*\\\\.?$"), "").trim()

        return ParsedTaskResult(
            title = if (cleanTitle.isNotEmpty()) cleanTitle else rawText,
            category = category,
            dueDate = todayJalali,
            dueTime = dueTime,
            durationMinutes = duration,
            priority = priority,
            recurrence = recurrence,
            isTimeFixed = isTimeFixed,
            needsClarification = dueTime == null && rawText.contains("تماس"),
            clarificationQuestion = "این کار نیاز به ساعت دقیق دارد. مایلید در چه ساعتی تنظیم شود؟"
        )
    }
}`
  },
  {
    name: 'MainActivity.kt',
    path: 'app/src/main/java/com/hamrahman/app/ui/MainActivity.kt',
    content: `package com.hamrahman.app.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.hamrahman.app.ui.theme.HamrahManTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            HamrahManTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val taskViewModel: TaskViewModel = viewModel()
                    MainHomeScreen(viewModel = taskViewModel)
                }
            }
        }
    }
}`
  },
  {
    name: 'build.gradle.kts',
    path: 'app/build.gradle.kts',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.kapt)
}

android {
    namespace = "com.hamrahman.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.hamrahman.app"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
}

dependencies {
    // Jetpack Compose
    implementation(platform(libs.compose.bom))
    implementation(libs.ui)
    implementation(libs.material3)

    // Room Database
    implementation(libs.room.runtime)
    implementation(libs.room.ktx)
    kapt(libs.room.compiler)

    // Coroutines & WorkManager
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.work.runtime.ktx)

    // DataStore Preferences
    implementation(libs.datastore.preferences)
}`
  }
];

export const AndroidCodeExportModal: React.FC<AndroidCodeExportModalProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const activeFile = ANDROID_FILES[selectedFileIdx];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    const textData = ANDROID_FILES.map(
      (f) => `// ===============================\n// FILE: ${f.path}\n// ===============================\n\n${f.content}\n\n`
    ).join('\n');
    const blob = new Blob([textData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'HamrahMan_Android_Phase1_Source.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                پکیج سورس‌کد اندروید (Kotlin + Jetpack Compose + Room)
              </h2>
              <span className="text-[11px] text-slate-600 dark:text-slate-300">
                پروژه آماده استقرار روی Xiaomi POCO M4 · بسته com.hamrahman.app
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAll}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">دانلود تمام فایل‌ها</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main 2-column Layout */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-full sm:w-64 bg-slate-50 dark:bg-slate-950 border-b sm:border-b-0 sm:border-l border-slate-200 dark:border-slate-800 p-3 overflow-y-auto space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 px-2 py-1">
              <FolderTree className="w-3.5 h-3.5" />
              <span>ساختار فایل‌های مرحله اول</span>
            </div>
            {ANDROID_FILES.map((file, idx) => (
              <button
                key={file.name}
                onClick={() => setSelectedFileIdx(idx)}
                className={`w-full text-right px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                  selectedFileIdx === idx
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Code Viewer */}
          <div className="flex-1 flex flex-col bg-slate-900 text-slate-100 overflow-hidden font-mono text-xs">
            {/* File Path & Copy */}
            <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400 truncate">
                {activeFile.path}
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'کپی شد!' : 'کپی کد'}</span>
              </button>
            </div>

            {/* Code Content */}
            <pre className="flex-1 p-4 overflow-auto text-emerald-300/90 leading-relaxed text-[11px] sm:text-xs font-mono" dir="ltr">
              {activeFile.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
