import { supabase } from '../lib/supabase';
import { screenTimeService, ScreenTimeData } from './screenTimeService';
import { getHealthData, HealthData, requestHealthPermissions, hasHealthPermissions } from './healthConnectService';

export interface ManualLogData {
  mealsPerDay: number;
  calorieIntake: number;
}

export interface AutoCollectedData {
  screenTime: number;
  lateNightUsage: number;
  sleepHours: number;
  activityLevel: 'low' | 'moderate' | 'high';
  sittingTime: number;
  inactivityPeriods: number;
  steps: number;
}

export interface DailyLogEntry {
  screenTime: number;
  lateNightUsage: number;
  sleepHours: number;
  activityLevel: string;
  sittingTime: number;
  inactivityPeriods: number;
  steps: number;
  mealsPerDay: number;
  calorieIntake: number;
}

/**
 * Collect auto-detected data from screen time and wearable services
 */
export async function collectAutoData(): Promise<AutoCollectedData> {
  let screenData: ScreenTimeData = { screenTime: 0, lateNightUsage: 0 };
  let healthData: HealthData = {
    sleepHours: 0,
    activityLevel: 'low',
    sittingTime: 0,
    inactivityPeriods: 0,
    steps: 0,
  };

  try {
    screenData = await screenTimeService.getScreenTimeData();
  } catch (error) {
    console.error('Failed to collect screen time data:', error);
  }

  try {
    if (hasHealthPermissions()) {
      healthData = await getHealthData();
    }
  } catch (error) {
    console.error('Failed to collect health data:', error);
  }

  return {
    screenTime: screenData.screenTime,
    lateNightUsage: screenData.lateNightUsage,
    sleepHours: healthData.sleepHours,
    activityLevel: healthData.activityLevel,
    sittingTime: healthData.sittingTime,
    inactivityPeriods: healthData.inactivityPeriods,
    steps: healthData.steps,
  };
}

/**
 * Submit a daily log entry (upsert - one per user per day)
 */
export async function submitDailyLog(
  userId: string,
  autoData: AutoCollectedData,
  manualData: ManualLogData
): Promise<{ success: boolean; error?: string }> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    const { error } = await supabase
      .from('daily_logs')
      .upsert(
        {
          user_id: userId,
          date: today,
          screen_time: autoData.screenTime,
          late_night_usage: autoData.lateNightUsage,
          sleep_hours: autoData.sleepHours,
          activity_level: autoData.activityLevel,
          sitting_time: autoData.sittingTime,
          inactivity_periods: autoData.inactivityPeriods,
          steps: autoData.steps,
          meals_per_day: manualData.mealsPerDay,
          calorie_intake: manualData.calorieIntake,
        },
        {
          onConflict: 'user_id,date',
        }
      );

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Failed to submit daily log:', error);
    return { success: false, error: error.message || 'Failed to save daily log' };
  }
}

/**
 * Get today's existing log for a user
 */
export async function getTodayLog(userId: string): Promise<DailyLogEntry | null> {
  const today = new Date().toISOString().split('T')[0];

  try {
    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (error || !data) return null;

    return {
      screenTime: data.screen_time || 0,
      lateNightUsage: data.late_night_usage || 0,
      sleepHours: data.sleep_hours || 0,
      activityLevel: data.activity_level || 'low',
      sittingTime: data.sitting_time || 0,
      inactivityPeriods: data.inactivity_periods || 0,
      steps: data.steps || 0,
      mealsPerDay: data.meals_per_day || 3,
      calorieIntake: data.calorie_intake || 0,
    };
  } catch (error) {
    console.error('Failed to fetch today\'s log:', error);
    return null;
  }
}

/**
 * Get streak data: current streak, best streak, and total logs
 */
export async function getStreakData(userId: string): Promise<{ currentStreak: number; bestStreak: number; totalLogs: number }> {
  try {
    const { data, error } = await supabase
      .from('daily_logs')
      .select('date')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) {
      return { currentStreak: 0, bestStreak: 0, totalLogs: 0 };
    }

    const totalLogs = data.length;
    let currentStreak = 0;
    let bestStreak = 0;
    let currentCount = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logDates = data.map(log => {
      const parts = log.date.split('-');
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    });

    let prevDate: Date | null = null;

    // Calculate best streak and current streak
    for (let i = 0; i < logDates.length; i++) {
      const logDate = logDates[i];
      if (prevDate) {
        const diffTime = Math.abs(prevDate.getTime() - logDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentCount++;
        } else if (diffDays > 1) {
          if (currentCount > bestStreak) bestStreak = currentCount;
          currentCount = 1;
        }
      } else {
        currentCount = 1;
      }
      prevDate = logDate;
    }
    if (currentCount > bestStreak) bestStreak = currentCount;

    // Calculate current streak
    // Check if the most recent log is from today or yesterday
    if (logDates.length > 0) {
      const mostRecent = logDates[0];
      const diffTimeMostRecent = Math.abs(today.getTime() - mostRecent.getTime());
      const diffDaysMostRecent = Math.floor(diffTimeMostRecent / (1000 * 60 * 60 * 24));
      
      if (diffDaysMostRecent <= 1) {
         // The streak is still alive
         let streak = 1;
         for (let i = 0; i < logDates.length - 1; i++) {
           const d1 = logDates[i];
           const d2 = logDates[i + 1];
           const diff = Math.abs(d1.getTime() - d2.getTime());
           const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
           if (days === 1) {
             streak++;
           } else if (days > 1) {
             break;
           }
         }
         currentStreak = streak;
      } else {
         currentStreak = 0;
      }
    }

    return { currentStreak, bestStreak, totalLogs };
  } catch (error) {
    console.error('Failed to fetch streak data:', error);
    return { currentStreak: 0, bestStreak: 0, totalLogs: 0 };
  }
}
