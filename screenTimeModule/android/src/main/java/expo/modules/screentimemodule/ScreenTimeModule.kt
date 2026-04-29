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

      // Debug toggle: set to true temporarily to log per-package durations
      val DEBUG_LOG_PACKAGES = true
        // Force using event-based aggregation (more precise for sub-windows on many OEMs)
        val ALWAYS_USE_EVENTS = true

      // Resolve the current home/launcher package so we can ignore it (Digital Wellbeing excludes home activity)
      val homeIntent = Intent(Intent.ACTION_MAIN)
      homeIntent.addCategory(Intent.CATEGORY_HOME)
      val resolveHome = context.packageManager.resolveActivity(homeIntent, PackageManager.MATCH_DEFAULT_ONLY)
      val homePackage = resolveHome?.activityInfo?.packageName ?: ""

      // Helper: decide whether to include a package in totals
      fun shouldIncludePackage(pkg: String): Boolean {
        if (pkg.isEmpty()) return false
        if (pkg == homePackage) return false
        if (pkg == "android") return false
        if (pkg == "host.exp.exponent") return false // exclude Expo dev client
        try {
          val ai = context.packageManager.getApplicationInfo(pkg, 0)
          val isSystem = (ai.flags and ApplicationInfo.FLAG_SYSTEM) != 0 || (ai.flags and ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) != 0
          if (isSystem) return false
        } catch (_: Exception) {
          // If we can't find info, be conservative and include it
        }
        return true
      }

      // Helper to aggregate total foreground time between two timestamps by processing UsageEvents
      // Returns Pair(totalMillis, perPackageMillis)
      fun aggregateForeground(start: Long, end: Long): Pair<Long, Map<String, Long>> {
        // Prefer system aggregation on Android Q+ which is more likely to match
        // Digital Wellbeing. However some OEMs return daily totals for sub-windows.
        // Allow forcing event-based aggregation when needed.
        if (!ALWAYS_USE_EVENTS && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          try {
              val agg = usageStatsManager.queryAndAggregateUsageStats(start, end)
              var total: Long = 0
              val map = mutableMapOf<String, Long>()
              agg.forEach { (pkg, st) ->
                try {
                  val t = st.totalTimeInForeground
                  if (!shouldIncludePackage(pkg)) {
                    if (DEBUG_LOG_PACKAGES) Log.d("ScreenTimeModule", "skipping package $pkg from QAgg (excluded)")
                  } else {
                    map[pkg] = t
                    total += t
                  }
                } catch (_: Exception) {
                }
              }
              // Validate QAgg result: if it reports more time than the requested window
              // (or zero), it's likely unreliable for this sub-window on some OEMs.
              val windowLen = end - start
              if (total <= 0 || total > windowLen) {
                if (DEBUG_LOG_PACKAGES) Log.w("ScreenTimeModule", "queryAndAggregate returned suspicious total=$total for windowLen=$windowLen; falling back to events")
              } else {
                if (DEBUG_LOG_PACKAGES) Log.i("ScreenTimeModule", "aggregateForeground(QAgg) ${Date(start)} -> ${Date(end)} total=${total} breakdown=${map}")
                return Pair(total, map)
              }
          } catch (_: Exception) {
            // fall through to event-based aggregation
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
              totals[pkg] = (totals[pkg] ?: 0) + delta
            }
          }
        }

        // For any package still in foreground, count until 'end'
        lastForeground.forEach { (pkg, ts) ->
          val delta = end - ts
          if (delta > 0) totals[pkg] = (totals[pkg] ?: 0) + delta
        }

        // Filter out system/dev packages from the totals map
        val filtered = mutableMapOf<String, Long>()
        totals.forEach { (pkg, value) ->
          if (shouldIncludePackage(pkg)) filtered[pkg] = value
          else if (DEBUG_LOG_PACKAGES) Log.d("ScreenTimeModule", "skipping package $pkg from events (excluded)")
        }

        var total: Long = 0
        filtered.values.forEach { total += it }
        if (DEBUG_LOG_PACKAGES) Log.i("ScreenTimeModule", "aggregateForeground(events) ${Date(start)} -> ${Date(end)} total=${total} breakdown=${filtered}")
        return Pair(total, filtered)
      }

      // Total screen time since midnight
      val (totalMillis, totalBreakdown) = try {
        aggregateForeground(startOfDay, now)
      } catch (e: Exception) {
        // fallback to queryUsageStats if events fail
        try {
          var total: Long = 0
          val stats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startOfDay, now)
          val map = mutableMapOf<String, Long>()
          stats?.forEach { st ->
            map[st.packageName] = st.totalTimeInForeground
            total += st.totalTimeInForeground
          }
          if (DEBUG_LOG_PACKAGES) Log.i("ScreenTimeModule", "fallback queryUsageStats ${Date(startOfDay)} -> ${Date(now)} total=${total} breakdown=${map}")
          Pair(total, map)
        } catch (ex: Exception) {
          Pair(0L, emptyMap())
        }
      }

      var screenTimeHours = totalMillis / (1000 * 60 * 60.0)

      // Late night aggregation: 23:00 - 04:00 window
      // We'll consider both yesterday's 23:00->today 04:00 and today's 23:00->tomorrow 04:00,
      // but only count the overlap with the period [startOfDay, now] so we don't double-count.
      fun overlap(aStart: Long, aEnd: Long, bStart: Long, bEnd: Long): Long {
        val s = Math.max(aStart, bStart)
        val e = Math.min(aEnd, bEnd)
        return if (e > s) (e - s) else 0L
      }

      // Window length = 5 hours (23:00 -> 04:00)
      val fiveHours = 5 * 60 * 60 * 1000L

      // Build today's 23:00
      calendar.set(Calendar.HOUR_OF_DAY, 23)
      calendar.set(Calendar.MINUTE, 0)
      calendar.set(Calendar.SECOND, 0)
      calendar.set(Calendar.MILLISECOND, 0)
      val todayLateStart = calendar.timeInMillis
      val todayLateEnd = todayLateStart + fiveHours

      // Yesterday's late window
      val yesterdayLateStart = todayLateStart - 24 * 60 * 60 * 1000L
      val yesterdayLateEnd = yesterdayLateStart + fiveHours

      var lateMillisTotal: Long = 0

      // Consider overlap of yesterday's late window with [startOfDay, now]
      val overlapYesterday = overlap(yesterdayLateStart, yesterdayLateEnd, startOfDay, now)
      if (overlapYesterday > 0) {
        try {
          val s = Math.max(yesterdayLateStart, startOfDay)
          val e = Math.min(yesterdayLateEnd, now)
          val (millis, breakdown) = aggregateForeground(s, e)
          lateMillisTotal += millis
          if (DEBUG_LOG_PACKAGES) Log.i("ScreenTimeModule", "yesterdayLate breakdown=${breakdown}")
        } catch (e: Exception) {
          try {
            var total: Long = 0
            val stats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, Math.max(yesterdayLateStart, startOfDay), Math.min(yesterdayLateEnd, now))
            stats?.forEach { total += it.totalTimeInForeground }
            lateMillisTotal += total
          } catch (_: Exception) {}
        }
      }

      // Consider overlap of today's late window with [startOfDay, now]
      val overlapToday = overlap(todayLateStart, todayLateEnd, startOfDay, now)
      if (overlapToday > 0) {
        try {
          val s = Math.max(todayLateStart, startOfDay)
          val e = Math.min(todayLateEnd, now)
          val (millis, breakdown) = aggregateForeground(s, e)
          lateMillisTotal += millis
          if (DEBUG_LOG_PACKAGES) Log.i("ScreenTimeModule", "todayLate breakdown=${breakdown}")
        } catch (e: Exception) {
          try {
            var total: Long = 0
            val stats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, Math.max(todayLateStart, startOfDay), Math.min(todayLateEnd, now))
            stats?.forEach { total += it.totalTimeInForeground }
            lateMillisTotal += total
          } catch (_: Exception) {}
        }
      }

      var lateNightHours = lateMillisTotal / (1000 * 60 * 60.0)

      // Apply rounding rule: if fractional part goes beyond 0.59h, count it as next full hour
      fun applyRounding(hours: Double): Double {
        val floor = Math.floor(hours)
        val frac = hours - floor
        return if (frac > 0.59) Math.ceil(hours) else String.format("%.2f", hours).toDouble()
      }

      screenTimeHours = applyRounding(screenTimeHours)
      lateNightHours = applyRounding(lateNightHours)

      val result = mutableMapOf<String, Any>(
        "screenTime" to screenTimeHours,
        "lateNightUsage" to lateNightHours
      )
      if (DEBUG_LOG_PACKAGES) {
        // Convert breakdown to hours map for easier JS inspection
        val breakdownHours = totalBreakdown.mapValues { (k, v) -> v / (1000.0 * 60 * 60) }
        result["breakdown"] = breakdownHours
      }
      return@AsyncFunction result
    }
  }
}