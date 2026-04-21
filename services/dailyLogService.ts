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

