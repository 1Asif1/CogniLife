package expo.modules.screentimemodule

import android.app.usage.UsageStatsManager
import android.app.usage.UsageEvents
import android.content.Context
import android.os.Build
import android.util.Log
import android.content.Intent
import android.content.pm.PackageManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.*

class ScreenTimeModule : Module() {
  private val TAG = "ScreenTimeModule"

  override fun definition() = ModuleDefinition {
    Name("ScreenTimeModule")

    AsyncFunction("getUsageStats") {
      val context = appContext.reactContext
        ?: return@AsyncFunction mapOf("screenTime" to 0.0, "lateNightUsage" to 0.0)

      val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      val now = System.currentTimeMillis()

      val cal = Calendar.getInstance()
      cal.set(Calendar.HOUR_OF_DAY, 0)
      cal.set(Calendar.MINUTE, 0)
      cal.set(Calendar.SECOND, 0)
      cal.set(Calendar.MILLISECOND, 0)
      val startOfDay = cal.timeInMillis

      // Resolve home launcher to exclude
      val homeIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
      val resolveHome = context.packageManager.resolveActivity(homeIntent, PackageManager.MATCH_DEFAULT_ONLY)
      val homePackage = resolveHome?.activityInfo?.packageName ?: ""

      fun shouldInclude(pkg: String): Boolean {
        if (pkg.isEmpty() || pkg == "android" || pkg == homePackage) return false
        return true
      }

      // ── Events-based calculation ──
      // This is the only reliable cross-device method that properly scopes
      // foreground time to the requested window.
      // On API 29+ we try ACTIVITY_RESUMED/ACTIVITY_PAUSED first;
      // fall back to MOVE_TO_FOREGROUND/MOVE_TO_BACKGROUND if no events found.
      fun computeFromEvents(start: Long, end: Long): Long {
        if (end <= start) return 0L

        val events = usm.queryEvents(start, end)
        val ev = UsageEvents.Event()

        val useModern = Build.VERSION.SDK_INT >= 29
        var eventCount = 0

        class Interval(val start: Long, val end: Long)
        val intervals = mutableListOf<Interval>()
        val lastFg = mutableMapOf<String, Long>()

        while (events.hasNextEvent()) {
          events.getNextEvent(ev)
          val pkg = ev.packageName ?: continue
          val t = ev.eventType
          eventCount++

          val isFg = if (useModern) t == 7 else t == 1
          val isBg = if (useModern) (t == 8 || t == 23) else t == 2

          if (isFg) {
            if (!lastFg.containsKey(pkg)) {
              lastFg[pkg] = Math.max(ev.timeStamp, start)
            }
          } else if (isBg) {
            val fg = lastFg.remove(pkg)
            if (fg != null) {
              val intervalEnd = Math.min(ev.timeStamp, end)
              if (shouldInclude(pkg) && intervalEnd > fg) {
                intervals.add(Interval(fg, intervalEnd))
              }
            }
          }
        }

        lastFg.forEach { (pkg, ts) ->
          if (shouldInclude(pkg)) {
            val intervalEnd = Math.min(end, System.currentTimeMillis())
            if (intervalEnd > ts) {
              intervals.add(Interval(ts, intervalEnd))
            }
          }
        }

        Log.d(TAG, "Events processed: $eventCount (modern=$useModern)")

        // Fallback to legacy types if modern yielded nothing on API 29+
        if (useModern && intervals.isEmpty()) {
          Log.d(TAG, "No modern intervals found, retrying with legacy types")
          val legacyEvents = usm.queryEvents(start, end)
          val legacyEv = UsageEvents.Event()
          val legacyFg = mutableMapOf<String, Long>()

          while (legacyEvents.hasNextEvent()) {
            legacyEvents.getNextEvent(legacyEv)
            val pkg = legacyEv.packageName ?: continue
            when (legacyEv.eventType) {
              1 -> { // MOVE_TO_FOREGROUND
                if (!legacyFg.containsKey(pkg)) legacyFg[pkg] = Math.max(legacyEv.timeStamp, start)
              }
              2 -> { // MOVE_TO_BACKGROUND
                val fg = legacyFg.remove(pkg)
                if (fg != null) {
                  val intervalEnd = Math.min(legacyEv.timeStamp, end)
                  if (shouldInclude(pkg) && intervalEnd > fg) {
                    intervals.add(Interval(fg, intervalEnd))
                  }
                }
              }
            }
          }
          legacyFg.forEach { (pkg, ts) ->
            if (shouldInclude(pkg)) {
              val intervalEnd = Math.min(end, System.currentTimeMillis())
              if (intervalEnd > ts) {
                intervals.add(Interval(ts, intervalEnd))
              }
            }
          }
        }

        if (intervals.isEmpty()) return 0L

        // Merge overlapping intervals to prevent double-counting
        intervals.sortBy { it.start }
        var totalMillis = 0L
        var currentStart = intervals[0].start
        var currentEnd = intervals[0].end

        for (i in 1 until intervals.size) {
          val interval = intervals[i]
          if (interval.start <= currentEnd) {
            // Overlap, extend the current interval
            currentEnd = Math.max(currentEnd, interval.end)
          } else {
            // No overlap, add duration and start new interval
            totalMillis += (currentEnd - currentStart)
            currentStart = interval.start
            currentEnd = interval.end
          }
        }
        totalMillis += (currentEnd - currentStart)

        return totalMillis
      }

      // ── Total screen time since midnight ──
      val totalMillis = computeFromEvents(startOfDay, now)
      Log.d(TAG, "Total screen time: ${totalMillis / 60000}m")

      // ── Late night (23:00–04:00) ──
      val fiveHours = 5 * 60 * 60 * 1000L
      cal.set(Calendar.HOUR_OF_DAY, 23)
      cal.set(Calendar.MINUTE, 0)
      cal.set(Calendar.SECOND, 0)
      cal.set(Calendar.MILLISECOND, 0)
      val todayLateStart = cal.timeInMillis
      val yesterdayLateStart = todayLateStart - 24 * 60 * 60 * 1000L

      var lateMillis: Long = 0
      val s1 = Math.max(yesterdayLateStart, startOfDay)
      val e1 = Math.min(yesterdayLateStart + fiveHours, now)
      if (e1 > s1) lateMillis += computeFromEvents(s1, e1)
      val s2 = Math.max(todayLateStart, startOfDay)
      val e2 = Math.min(todayLateStart + fiveHours, now)
      if (e2 > s2) lateMillis += computeFromEvents(s2, e2)

      val screenMin = (totalMillis / (1000 * 60)).toDouble()
      val lateMin = (lateMillis / (1000 * 60)).toDouble()
      Log.d(TAG, "Final → screen=${screenMin}m, lateNight=${lateMin}m")

      return@AsyncFunction mapOf(
        "screenTime" to screenMin,
        "lateNightUsage" to lateMin
      )
    }
  }
}