package expo.modules.screentimemodule

import android.app.usage.UsageStatsManager
import android.app.usage.UsageEvents
import android.content.Context
import android.os.Build
import android.util.Log
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.*

class ScreenTimeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ScreenTimeModule")

    AsyncFunction("getUsageStats") {
      val context = appContext.reactContext
        ?: return@AsyncFunction mapOf("screenTime" to 0.0, "lateNightUsage" to 0.0)

      val usageStatsManager =
        context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

      val now = System.currentTimeMillis()

      // Start of day (midnight)
      val calendar = Calendar.getInstance()
      calendar.set(Calendar.HOUR_OF_DAY, 0)
      calendar.set(Calendar.MINUTE, 0)
      calendar.set(Calendar.SECOND, 0)
      calendar.set(Calendar.MILLISECOND, 0)

      val startOfDay = calendar.timeInMillis

      // Use system-aggregated stats for better accuracy/matching with Digital Wellbeing
      val ALWAYS_USE_EVENTS = false

      // Resolve home/launcher
      val homeIntent = Intent(Intent.ACTION_MAIN)
      homeIntent.addCategory(Intent.CATEGORY_HOME)
      val resolveHome = context.packageManager.resolveActivity(homeIntent, PackageManager.MATCH_DEFAULT_ONLY)
      val homePackage = resolveHome?.activityInfo?.packageName ?: ""

      // Helper: decide whether to include a package in totals
      fun shouldIncludePackage(pkg: String): Boolean {
        if (pkg.isEmpty()) return false
        if (pkg == "android") return false
        if (pkg == homePackage) return false
        
        // Include everything else to match Digital Wellbeing's inclusiveness
        return true
      }

      // Helper to aggregate total foreground time
      fun aggregateForeground(start: Long, end: Long): Pair<Long, Map<String, Long>> {
        if (!ALWAYS_USE_EVENTS) {
          try {
            val agg = usageStatsManager.queryAndAggregateUsageStats(start, end)
            var total: Long = 0
            val filteredMap = mutableMapOf<String, Long>()
            
            agg.forEach { (pkg, st) ->
              if (shouldIncludePackage(pkg)) {
                val time = st.totalTimeInForeground
                if (time > 0) {
                  filteredMap[pkg] = time
                  total += time
                }
              }
            }
            if (total > 0) return Pair(total, filteredMap)
          } catch (e: Exception) {
            // fall through to events if this fails
          }
        }

        val totals = mutableMapOf<String, Long>()
        val lastForeground = mutableMapOf<String, Long>()
        val events = usageStatsManager.queryEvents(start, end)
        val event = UsageEvents.Event()

        while (events.hasNextEvent()) {
          events.getNextEvent(event)
          val pkg = event.packageName ?: continue
          when (event.eventType) {
            UsageEvents.Event.MOVE_TO_FOREGROUND -> {
              lastForeground[pkg] = event.timeStamp
            }
            UsageEvents.Event.MOVE_TO_BACKGROUND -> {
              val fg = lastForeground.remove(pkg) ?: start
              val delta = event.timeStamp - fg
              if (delta > 0) totals[pkg] = (totals[pkg] ?: 0) + delta
            }
          }
        }

        lastForeground.forEach { (pkg, ts) ->
          val delta = end - ts
          if (delta > 0) totals[pkg] = (totals[pkg] ?: 0) + delta
        }

        val filtered = mutableMapOf<String, Long>()
        var total: Long = 0
        totals.forEach { (pkg, value) ->
          if (shouldIncludePackage(pkg)) {
            filtered[pkg] = value
            total += value
          }
        }
        
        return Pair(total, filtered)
      }

      // Total screen time since midnight
      val (totalMillis, _) = try {
        aggregateForeground(startOfDay, now)
      } catch (e: Exception) {
        Pair(0L, emptyMap())
      }

      // Late night aggregation: 23:00 - 04:00 window
      fun overlap(aStart: Long, aEnd: Long, bStart: Long, bEnd: Long): Long {
        val s = Math.max(aStart, bStart)
        val e = Math.min(aEnd, bEnd)
        return if (e > s) (e - s) else 0L
      }

      val fiveHours = 5 * 60 * 60 * 1000L
      calendar.set(Calendar.HOUR_OF_DAY, 23)
      calendar.set(Calendar.MINUTE, 0)
      calendar.set(Calendar.SECOND, 0)
      calendar.set(Calendar.MILLISECOND, 0)
      val todayLateStart = calendar.timeInMillis
      val yesterdayLateStart = todayLateStart - 24 * 60 * 60 * 1000L

      var lateMillisTotal: Long = 0
      
      // Yesterday late night overlap
      val s1 = Math.max(yesterdayLateStart, startOfDay)
      val e1 = Math.min(yesterdayLateStart + fiveHours, now)
      if (e1 > s1) {
        lateMillisTotal += aggregateForeground(s1, e1).first
      }

      // Today late night overlap
      val s2 = Math.max(todayLateStart, startOfDay)
      val e2 = Math.min(todayLateStart + fiveHours, now)
      if (e2 > s2) {
        lateMillisTotal += aggregateForeground(s2, e2).first
      }

      // Return results in MINUTES for better precision
      val screenTimeMinutes = (totalMillis / (1000 * 60)).toDouble()
      val lateNightMinutes = (lateMillisTotal / (1000 * 60)).toDouble()

      return@AsyncFunction mapOf(
        "screenTime" to screenTimeMinutes,
        "lateNightUsage" to lateNightMinutes
      )
    }
  }
}