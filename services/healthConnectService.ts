import { Platform, Alert } from 'react-native';
import {
  initialize,
  requestPermission,
  readRecords,
  getSdkStatus,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

export interface HealthData {
  sleepHours: number;
  activityLevel: 'low' | 'moderate' | 'high';
  sittingTime: number;         // hours
  inactivityPeriods: number;   // count of 1hr+ inactive stretches
}

/**
 * Health Connect Service
 * 
 * Wraps Google Health Connect (Android) to fetch wearable/fitness data.
 * 
 * Prerequisites:
 * - Requires development build (npx expo run:android)
 * - Device must have Health Connect app installed
 * - User must have screen lock enabled
 */

let isInitialized = false;
let hasPermission = false;

/**
 * Initialize Health Connect SDK
 */
export async function initializeHealthConnect(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  try {
    const isAvailable = await getSdkStatus();
    if (isAvailable !== SdkAvailabilityStatus.SDK_AVAILABLE) {
      console.log('Health Connect is not available on this device');
      return false;
    }
    
    // Some versions of the library automatically initialize, but calling it is safer.
    await initialize();
    isInitialized = true;
    
    return true;
  } catch (error) {
    console.error('Failed to initialize Health Connect:', error);
    return false;
  }
}

/**
 * Request Health Connect permissions
 */
export async function requestHealthPermissions(): Promise<boolean> {
  if (!isInitialized) {
    const initialized = await initializeHealthConnect();
    if (!initialized) return false;
  }

  try {
    const permissions = await requestPermission([
      { accessType: 'read', recordType: 'SleepSession' },
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'ExerciseSession' },
      { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
    ]);
    
    hasPermission = permissions.length > 0;
    return hasPermission;
    
  } catch (error) {
    console.error('Failed to request Health Connect permissions:', error);
    return false;
  }
}

/**
 * Get sleep hours from last night
 */
async function getSleepHours(): Promise<number> {
  if (!hasPermission) return 0;

  try {
    const now = new Date();
    const startOfYesterday = new Date(now);
    startOfYesterday.setDate(now.getDate() - 1);
    startOfYesterday.setHours(18, 0, 0, 0); // 6 PM yesterday
    
    const result = await readRecords('SleepSession', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startOfYesterday.toISOString(),
        endTime: now.toISOString(),
      },
    });
    
    let totalSleepMs = 0;
    result.records.forEach((record: any) => {
      const start = new Date(record.startTime).getTime();
      const end = new Date(record.endTime).getTime();
      totalSleepMs += (end - start);
    });
    return Math.round((totalSleepMs / (1000 * 60 * 60)) * 10) / 10;
  } catch (error) {
    console.error('Failed to read sleep data:', error);
    return 0;
  }
}

/**
 * Get step count for today
 */
async function getStepCount(): Promise<number> {
  if (!hasPermission) return 0;

  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    
    const result = await readRecords('Steps', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startOfDay.toISOString(),
        endTime: now.toISOString(),
      },
    });
    
    let totalSteps = 0;
    result.records.forEach((record: any) => {
      totalSteps += record.count;
    });
    return totalSteps;
  } catch (error) {
    console.error('Failed to read steps data:', error);
    return 0;
  }
}

/**
 * Derive activity level from step count
 */
function deriveActivityLevel(steps: number): 'low' | 'moderate' | 'high' {
  if (steps < 4000) return 'low';
  if (steps < 8000) return 'moderate';
  return 'high';
}

/**
 * Get all health data from Health Connect
 */
export async function getHealthData(): Promise<HealthData> {
  if (!hasPermission) {
    return {
      sleepHours: 0,
      activityLevel: 'low',
      sittingTime: 0,
      inactivityPeriods: 0,
    };
  }

  const [sleepHours, steps] = await Promise.all([
    getSleepHours(),
    getStepCount(),
  ]);

  const activityLevel = deriveActivityLevel(steps);
  
  // Estimate sitting time: 16 waking hours minus active time
  // Rough estimate: 1 step ≈ 0.5 seconds of activity
  const activeHours = (steps * 0.5) / 3600;
  const wakingHours = 16;
  const sittingTime = Math.max(0, Math.round((wakingHours - activeHours) * 10) / 10);
  
  // Estimate inactivity periods: hours of sitting / threshold
  const inactivityPeriods = Math.floor(sittingTime / 2);

  return {
    sleepHours: Math.max(0, sleepHours),
    activityLevel,
    sittingTime,
    inactivityPeriods,
  };
}

/**
 * Check if Health Connect is available
 */
export function isHealthConnectAvailable(): boolean {
  return Platform.OS === 'android';
}

/**
 * Check if permissions are granted
 */
export function hasHealthPermissions(): boolean {
  return hasPermission;
}
