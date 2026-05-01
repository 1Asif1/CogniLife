import { Linking, Platform } from 'react-native';

export type ConfirmDialog = (config: {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}) => Promise<boolean>;

export interface HealthData {
  sleepHours: number;
  activityLevel: number;       // 1-5 scale
  sittingTime: number;         // hours
  inactivityPeriods: number;   // count of 1hr+ inactive stretches
  steps: number;               // step count for today
}

/**
 * Labels interface for multilingual support.
 * Pass translated strings from your React component via useTranslated().
 * All fields are optional — English fallbacks are used if not provided.
 */
export interface HealthConnectLabels {
  // getHealthConnectStatus labels
  notAvailableOniOS?: string;
  notInstalled?: string;
  errorCheckingStatus?: string;
  // requestHealthPermissions labels
  hcNotAvailableTitle?: string;
  hcNotAvailableMessage?: string;
  hcNotAvailableConfirm?: string;
  permissionsRequiredTitle?: string;
  permissionsRequiredMessage?: string;
  permissionsRequiredConfirm?: string;
}

/**
 * Health Connect Service
 *
 * Wraps Google Health Connect (Android) to fetch wearable/fitness data.
 *
 * Prerequisites:
 * - Install: npx expo install react-native-health-connect expo-build-properties
 * - Requires development build (not Expo Go)
 * - Device must have Health Connect app installed
 * - User must have screen lock enabled
 *
 * When react-native-health-connect is installed and prebuild is done,
 * uncomment the real implementation and remove the simulated methods.
 */

import {
  getSdkStatus,
  initialize,
  readRecords,
  SdkAvailabilityStatus
} from 'react-native-health-connect';

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
      // Handle case where Health Connect is not installed
      if (isAvailable === SdkAvailabilityStatus.SDK_UNAVAILABLE) {
        console.log('Health Connect app is not installed. User should install it from Play Store.');
      }
      return false;
    }
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
 * Try to check if permissions are already granted, if not return false
 * The user should grant permissions in Health Connect app manually
 *
 * @param showConfirm  - optional dialog callback
 * @param labels       - optional translated strings (falls back to English)
 */
export async function requestHealthPermissions(
  showConfirm?: ConfirmDialog,
  labels?: HealthConnectLabels,
): Promise<boolean> {
  console.log('[Health Connect] requestHealthPermissions called');

  // Resolved labels with English fallbacks
  const l = {
    hcNotAvailableTitle:      labels?.hcNotAvailableTitle      ?? 'Health Connect Not Available',
    hcNotAvailableMessage:    labels?.hcNotAvailableMessage    ?? 'Health Connect is not available on this device. Please install it from the Play Store.',
    hcNotAvailableConfirm:    labels?.hcNotAvailableConfirm    ?? 'OK',
    permissionsRequiredTitle:   labels?.permissionsRequiredTitle   ?? 'Permissions Required',
    permissionsRequiredMessage: labels?.permissionsRequiredMessage ?? 'Please open Health Connect and grant permissions for Steps and Sleep data.',
    permissionsRequiredConfirm: labels?.permissionsRequiredConfirm ?? 'OK',
  };

  if (Platform.OS !== 'android') {
    console.log('[Health Connect] Not on Android, skipping');
    return false;
  }

  try {
    console.log('[Health Connect] Checking initialization status');
    if (!isInitialized) {
      console.log('[Health Connect] Not initialized, initializing now...');
      const initialized = await initializeHealthConnect();
      console.log('[Health Connect] Initialization result:', initialized);
      if (!initialized) {
        console.log('[Health Connect] Initialization failed');
        if (showConfirm) {
          await showConfirm({
            title:       l.hcNotAvailableTitle,
            message:     l.hcNotAvailableMessage,
            confirmText: l.hcNotAvailableConfirm,
          });
        }
        return false;
      }
    }

    console.log('[Health Connect] Checking if permissions are already granted');
    // Try to read a small amount of data to check if permissions are granted
    // This is safer than requesting permissions which causes crashes
    try {
      const now = new Date();
      const startOfYesterday = new Date(now);
      startOfYesterday.setDate(now.getDate() - 1);
      startOfYesterday.setHours(0, 0, 0, 0);

      const result = await readRecords('Steps', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startOfYesterday.toISOString(),
          endTime: now.toISOString(),
        },
      });

      console.log('[Health Connect] Successfully read steps data, permissions are granted');
      hasPermission = true;
      return true;
    } catch (readError) {
      console.log('[Health Connect] Could not read data, permissions may not be granted:', readError);
      if (showConfirm) {
        await showConfirm({
          title:       l.permissionsRequiredTitle,
          message:     l.permissionsRequiredMessage,
          confirmText: l.permissionsRequiredConfirm,
        });
      }
      return false;
    }
  } catch (error) {
    console.error('[Health Connect] Failed to check permissions:', error);
    console.error('[Health Connect] Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return false;
  }
}

/**
 * Get sleep hours from last 24 hours
 */
async function getSleepHours(): Promise<number> {
  if (!hasPermission) {
    console.log('Health Connect permission not granted for sleep data');
    return 0;
  }

  try {
    const now = new Date();
    const startOfYesterday = new Date(now);
    startOfYesterday.setDate(now.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0); // Start of yesterday

    const result = await readRecords('SleepSession', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startOfYesterday.toISOString(),
        endTime: now.toISOString(),
      },
    });

    if (!result.records || result.records.length === 0) {
      console.log('No sleep records found in the last 24 hours');
      return 0;
    }

    let totalSleepMs = 0;
    result.records.forEach((record: any) => {
      try {
        const start = new Date(record.startTime).getTime();
        const end = new Date(record.endTime).getTime();
        // Validate dates
        if (!isNaN(start) && !isNaN(end) && end > start) {
          totalSleepMs += (end - start);
        }
      } catch (e) {
        console.error('Error processing sleep record:', e);
      }
    });

    // Convert milliseconds to hours, round to 1 decimal place
    const sleepHours = Math.round((totalSleepMs / (1000 * 60 * 60)) * 10) / 10;

    // Validate reasonable sleep range (0-24 hours)
    if (sleepHours < 0 || sleepHours > 24) {
      console.warn('Sleep hours out of reasonable range:', sleepHours);
      return 0;
    }

    return sleepHours;
  } catch (error) {
    console.error('Failed to read sleep data:', error);
    return 0;
  }
}

/**
 * Get step count for last 24 hours
 */
async function getStepCount(): Promise<number> {
  if (!hasPermission) {
    console.log('Health Connect permission not granted for steps data');
    return 0;
  }

  try {
    const now = new Date();
    const startOfYesterday = new Date(now);
    startOfYesterday.setDate(now.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0); // Start of yesterday

    const result = await readRecords('Steps', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startOfYesterday.toISOString(),
        endTime: now.toISOString(),
      },
    });

    if (!result.records || result.records.length === 0) {
      console.log('No step records found in the last 24 hours');
      return 0;
    }

    let totalSteps = 0;
    result.records.forEach((record: any) => {
      try {
        // Validate step count is a number and non-negative
        if (typeof record.count === 'number' && record.count >= 0) {
          totalSteps += record.count;
        }
      } catch (e) {
        console.error('Error processing step record:', e);
      }
    });

    // Validate reasonable step range (0-100,000 steps per day)
    if (totalSteps < 0 || totalSteps > 100000) {
      console.warn('Step count out of reasonable range:', totalSteps);
      return 0;
    }

    return totalSteps;
  } catch (error) {
    console.error('Failed to read steps data:', error);
    return 0;
  }
}

/**
 * Derive activity level from step count (1-5 scale)
 * Assumption: Based on WHO recommendations and general activity guidelines
 * <3000: Sedentary (Level 1)
 * <6000: Low activity (Level 2)
 * <9000: Moderate activity (Level 3)
 * <12000: Active (Level 4)
 * >=12000: Very active (Level 5)
 */
function deriveActivityLevel(steps: number): number {
  if (steps < 3000) return 1;
  if (steps < 6000) return 2;
  if (steps < 9000) return 3;
  if (steps < 12000) return 4;
  return 5;
}

/**
 * Get all health data from Health Connect
 */
export async function getHealthData(): Promise<HealthData> {
  if (!hasPermission) {
    return {
      sleepHours: 0,
      activityLevel: 1,
      sittingTime: 0,
      inactivityPeriods: 0,
      steps: 0,
    };
  }

  const [sleepHours, steps] = await Promise.all([
    getSleepHours(),
    getStepCount(),
  ]);

  // Only calculate derived features if we have actual health data
  // If no steps and no sleep data, don't derive features from screen time
  const hasHealthData = steps > 0 || sleepHours > 0;

  if (!hasHealthData) {
    console.log('[Health Connect] No health data available, returning zeros');
    return {
      sleepHours: 0,
      activityLevel: 0,  // 0 indicates no data, not a valid activity level
      sittingTime: 0,
      inactivityPeriods: 0,
      steps: 0,
    };
  }

  const activityLevel = deriveActivityLevel(steps);

  // Estimate sitting time (hours)
  // Assumption: 16 waking hours per day (8 hours sleep)
  // Active time estimate: 1 step ≈ 0.5 seconds of walking/movement
  // This is a rough approximation; actual sitting time depends on many factors
  const activeHours = (steps * 0.5) / 3600;
  const wakingHours = 16;
  const sittingTime = Math.max(0, Math.round((wakingHours - activeHours) * 10) / 10);

  // Estimate inactivity periods (count of 1+ hour inactive stretches)
  // Assumption: Inactivity periods occur every ~2 hours of sitting
  // This is a heuristic estimate; actual inactivity varies by user behavior
  const inactivityPeriods = Math.floor(sittingTime / 2);

  return {
    sleepHours: Math.round(sleepHours * 10) / 10,
    activityLevel,
    sittingTime,
    inactivityPeriods,
    steps,
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

/**
 * Get Health Connect status and device info
 * Returns information about Health Connect availability and connection status
 *
 * @param labels - optional translated strings (falls back to English)
 */
export async function getHealthConnectStatus(labels?: HealthConnectLabels): Promise<{
  available: boolean;
  installed: boolean;
  hasPermission: boolean;
  deviceName: string;
  lastSync: string | null;
}> {
  // Resolved labels with English fallbacks
  const l = {
    notAvailableOniOS:    labels?.notAvailableOniOS    ?? 'Not available on iOS',
    notInstalled:         labels?.notInstalled         ?? 'Not installed',
    errorCheckingStatus:  labels?.errorCheckingStatus  ?? 'Error checking status',
  };

  if (Platform.OS !== 'android') {
    return {
      available: false,
      installed: false,
      hasPermission: false,
      deviceName: l.notAvailableOniOS,
      lastSync: null,
    };
  }

  try {
    const sdkStatus = await getSdkStatus();
    const installed = sdkStatus === SdkAvailabilityStatus.SDK_AVAILABLE;

    return {
      available: installed,
      installed,
      hasPermission: hasPermission,
      deviceName: installed ? 'Google Health Connect' : l.notInstalled,
      lastSync: hasPermission ? new Date().toISOString() : null,
    };
  } catch (error) {
    console.error('Failed to get Health Connect status:', error);
    return {
      available: false,
      installed: false,
      hasPermission: false,
      deviceName: l.errorCheckingStatus,
      lastSync: null,
    };
  }
}

/**
 * Open Health Connect app settings
 * This opens the Health Connect app on the device
 */
export async function openHealthConnectSettings(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  try {
    console.log('Attempting to open Health Connect settings');

    // Try to open Health Connect app using package scheme
    const healthConnectUrl = 'android-app://com.google.android.apps.healthconnect';
    console.log('Checking if can open URL:', healthConnectUrl);

    const canOpen = await Linking.canOpenURL(healthConnectUrl);
    console.log('Can open Health Connect:', canOpen);

    if (canOpen) {
      console.log('Opening Health Connect app');
      await Linking.openURL(healthConnectUrl);
      return true;
    }

    // Fallback: try opening with intent scheme
    const intentUrl = 'intent://com.google.android.apps.healthconnect#Intent;package=com.google.android.apps.healthconnect;end';
    console.log('Trying intent URL fallback');
    await Linking.openURL(intentUrl);
    return true;
  } catch (error) {
    console.error('Failed to open Health Connect settings:', error);
    // Final fallback: open Play Store in browser
    try {
      const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.google.android.apps.healthconnect';
      console.log('Opening Play Store in browser as final fallback');
      await Linking.openURL(playStoreUrl);
      return true;
    } catch (browserError) {
      console.error('Failed to open Play Store:', browserError);
      return false;
    }
  }
}