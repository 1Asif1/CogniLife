import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireNativeModule } from 'expo-modules-core';
import { Linking, Platform } from 'react-native';

// Direct connection to the native Android module
// This bypasses the need for the JS "build/index.js" file
const ScreenTimeModule = requireNativeModule('ScreenTimeModule');

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
 * Provides real-time usage data directly from Android's UsageStatsManager.
 */
class ScreenTimeService {
  private permissionGranted: boolean = false;

  /**
   * Check if screen time permission has been granted
   */
  async checkPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;

    try {
      // Direct native call. If this succeeds, we have access.
      await ScreenTimeModule.getUsageStats();
      this.permissionGranted = true;
      await AsyncStorage.setItem(SCREEN_TIME_PERMISSION_KEY, 'true');
      return true;
    } catch (e) {
      const stored = await AsyncStorage.getItem(SCREEN_TIME_PERMISSION_KEY);
      this.permissionGranted = stored === 'true';
      return this.permissionGranted;
    }
  }

  /**
   * Request screen time permission
   */
  async requestPermission(showConfirm?: ConfirmDialog): Promise<boolean> {
    if (Platform.OS !== 'android') return false;

    const confirmed = showConfirm
      ? await showConfirm({
          title: '📱 Screen Time Access',
          message: 'CogniLife needs access to your usage data to track screen time and late-night phone usage. This helps us provide better health insights.',
          confirmText: 'Open Settings',
          cancelText: 'Not Now',
        })
      : true;

    if (!confirmed) return false;

    try {
      await Linking.openSettings();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get today's screen time data
   */
  async getScreenTimeData(): Promise<ScreenTimeData> {
    if (Platform.OS !== 'android') return { screenTime: 0, lateNightUsage: 0 };

    try {
      const data = await ScreenTimeModule.getUsageStats();
      
      // Data arrives in MINUTES from the native module.
      // We convert to decimal hours for internal ML model compatibility.
      return {
        screenTime: Number((data.screenTime / 60).toFixed(2)),
        lateNightUsage: Number((data.lateNightUsage / 60).toFixed(2)),
      };
    } catch (e) {
      console.error('ScreenTimeModule Error:', e);
      return { screenTime: 0, lateNightUsage: 0 };
    }
  }

  /**
   * Formats decimal hours into a human-readable string (e.g., 6.48 -> "6h 29m")
   */
  formatDuration(hours: number): string {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  }

  /**
   * Check if the service is available on this platform
   */
  isAvailable(): boolean {
    return Platform.OS === 'android';
  }
}

export const screenTimeService = new ScreenTimeService();
