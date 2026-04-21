package expo.modules.screentime

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Calendar

class ExpoScreenTimeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoScreenTime")

    Function("checkPermission") {
      val context = appContext.reactContext ?: return@Function false
      val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val mode = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
        appOps.unsafeCheckOpNoThrow(
          AppOpsManager.OPSTR_GET_USAGE_STATS,
          Process.myUid(),
          context.packageName
        )
      } else {
        @Suppress("DEPRECATION")
        appOps.checkOpNoThrow(
          AppOpsManager.OPSTR_GET_USAGE_STATS,
          Process.myUid(),
          context.packageName
        )
      }
      mode == AppOpsManager.MODE_ALLOWED
    }

    Function("requestPermission") {
      val context = appContext.reactContext ?: return@Function false
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
      true
    }

    Function("getScreenTimeData") { ->
      val context = appContext.reactContext ?: return@Function mapOf("screenTime" to 0f, "lateNightUsage" to 0f)
      val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

      val calendar = Calendar.getInstance()
      calendar.set(Calendar.HOUR_OF_DAY, 0)
      calendar.set(Calendar.MINUTE, 0)
      calendar.set(Calendar.SECOND, 0)
      calendar.set(Calendar.MILLISECOND, 0)
      val startOfDay = calendar.timeInMillis
      val endOfDay = System.currentTimeMillis()

      val usageStats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startOfDay, endOfDay)
      var totalScreenTimeMs = 0L

      for (stats in usageStats ?: emptyList()) {
        if (stats.totalTimeInForeground > 0) {
          totalScreenTimeMs += stats.totalTimeInForeground
        }
      }

      var lateNightMs = 0L
      val hourOfDay = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
      if (hourOfDay >= 23 || hourOfDay < 5) {
        val lnCalendar = Calendar.getInstance()
        if (hourOfDay < 5) {
          lnCalendar.add(Calendar.DAY_OF_YEAR, -1)
        }
        lnCalendar.set(Calendar.HOUR_OF_DAY, 23)
        lnCalendar.set(Calendar.MINUTE, 0)
        lnCalendar.set(Calendar.SECOND, 0)
        lnCalendar.set(Calendar.MILLISECOND, 0)
        val lnStart = lnCalendar.timeInMillis
        
        val lnStats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, lnStart, endOfDay)
        for (stats in lnStats ?: emptyList()) {
          if (stats.totalTimeInForeground > 0) {
            lateNightMs += stats.totalTimeInForeground
          }
        }
      }

      val screenTimeHours = totalScreenTimeMs / (1000f * 60 * 60)
      val lateNightHours = lateNightMs / (1000f * 60 * 60)

      mapOf(
        "screenTime" to screenTimeHours,
        "lateNightUsage" to lateNightHours
      )
    }
  }
}
