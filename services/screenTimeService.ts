import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking, Platform } from 'react-native';
import ScreenTimeModule from 'screen-time-module';

export type ConfirmDialog = (config: {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}) => Promise<boolean>;

const SCREEN_TIME_PERMISSION_KEY = 'screen_time_permission_granted';

export interface ScreenTimeData {
  screenTime: number;       // total hours today
  lateNightUsage: number;   // hours after 11 PM
}

/**
 * Screen Time Service
 * 
 * This service provides screen time data collection for Android.
 * Currently uses a simulated approach with user self-reporting as fallback.
 * 
 * To implement the full native module later:
 * 1. Create an Expo native module using expo-modules-core
 * 2. Bridge Android's UsageStatsManager API
 * 3. Replace the mock methods below with native calls
 */
class ScreenTimeService {
  private permissionGranted: boolean = false;

  /**
   * Check if screen time permission has been granted
   */
  async checkPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;

    // Prefer a real check against the native module instead of relying solely on stored flag
    try {
      // If native module is available, try fetching usage stats; if it returns data, permission is effectively granted
      if (ScreenTimeModule && typeof ScreenTimeModule.getUsageStats === 'function') {
        try {
          const data = await ScreenTimeModule.getUsageStats();
          const has = (data && ((data.screenTime || 0) > 0 || (data.lateNightUsage || 0) > 0));
          this.permissionGranted = !!has;
          await AsyncStorage.setItem(SCREEN_TIME_PERMISSION_KEY, this.permissionGranted ? 'true' : 'false');
          return this.permissionGranted;
        } catch (e) {
          // native call failed, fall back to stored flag
          console.log('screenTimeService: native permission check failed', e);
        }
      }

      const stored = await AsyncStorage.getItem(SCREEN_TIME_PERMISSION_KEY);
      this.permissionGranted = stored === 'true';
      return this.permissionGranted;
    } catch (err) {
      console.log('screenTimeService: checkPermission error', err);
      return false;
    }
  }

  /**
   * Request screen time permission
   * On Android, this opens Usage Access settings where user must manually enable
   */
  async requestPermission(showConfirm?: ConfirmDialog): Promise<boolean> {
    if (Platform.OS !== 'android') {
      if (showConfirm) {
        await showConfirm({
          title: 'Not Supported',
          message: 'Screen time tracking is only available on Android.',
        });
      } else {
        Alert.alert('Not Supported', 'Screen time tracking is only available on Android.');
      }
      return false;
    }

    const confirmed = showConfirm
      ? await showConfirm({
          title: '📱 Screen Time Access',
          message: 'CogniLife needs access to your usage data to track screen time and late-night phone usage. This helps us provide better health insights.\n\nYou\'ll be taken to Settings where you need to find and enable CogniLife.',
          confirmText: 'Open Settings',
          cancelText: 'Not Now',
        })
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            '📱 Screen Time Access',
            'CogniLife needs access to your usage data to track screen time and late-night phone usage. This helps us provide better health insights.\n\nYou\'ll be taken to Settings where you need to find and enable CogniLife.',
            [
              { text: 'Not Now', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Open Settings', onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmed) return false;

    try {
      await Linking.openSettings();
      await AsyncStorage.setItem(SCREEN_TIME_PERMISSION_KEY, 'true');
      this.permissionGranted = true;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get today's screen time data
   * 
   * NOTE: This is currently a simulation. In production, replace with
   * native module calls to UsageStatsManager.queryUsageStats()
   */
async getScreenTimeData(): Promise<ScreenTimeData> {
  const hasPermission = await this.checkPermission();

  if (!hasPermission) {
    return { screenTime: 0, lateNightUsage: 0 };
  }

  try {
    const data = await ScreenTimeModule.getUsageStats();

    return {
      screenTime: Number(data.screenTime.toFixed(2)),
      lateNightUsage: Number(data.lateNightUsage.toFixed(2)),
    };
  } catch (e) {
    console.log('Native error:', e);
    return { screenTime: 0, lateNightUsage: 0 };
  }
}

  /**
   * Check if the service is available on this platform
   */
  isAvailable(): boolean {
    return Platform.OS === 'android';
  }
}

export const screenTimeService = new ScreenTimeService();
