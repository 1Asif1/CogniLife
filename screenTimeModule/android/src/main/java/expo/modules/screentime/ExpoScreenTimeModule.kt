package expo.modules.screentime

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.Build
import android.app.AppOpsManager
import java.util.Calendar

class ExpoScreenTimeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ScreenTimeModule")

    AsyncFunction("openSettings") {
      val intent = android.content.Intent(android.provider.Settings.ACTION_USAGE_ACCESS_SETTINGS)
      intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
      appContext.reactContext?.startActivity(intent)
    }

    AsyncFunction("getUsageStats") { promise: Promise ->
      try {
        val context = appContext.reactContext ?: throw Exception("React context not available")
        
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), context.packageName)
        } else {
            appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), context.packageName)
        }
        
        if (mode != AppOpsManager.MODE_ALLOWED) {
            throw Exception("USAGE_STATS_PERMISSION_DENIED")
        }

        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        
        val calendar = Calendar.getInstance()
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        val startOfDay = calendar.timeInMillis
        val now = System.currentTimeMillis()

        var totalDailyMinutes = 0L
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            val stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startOfDay, now)
            if (stats != null) {
                for (usageStats in stats) {
                    totalDailyMinutes += usageStats.totalTimeInForeground / 60000
                }
            }
        }

        val lateNightMinutes = 0L

        val result = mapOf(
            "screenTime" to totalDailyMinutes,
            "lateNightUsage" to lateNightMinutes
        )
        promise.resolve(result)
      } catch (e: Exception) {
        promise.reject("ERR_USAGE_STATS", e.message ?: "Unknown error", e)
      }
    }
  }
}
