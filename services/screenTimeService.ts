import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoScreenTime from '../modules/my-module'; // Import the local Expo module

const SCREEN_TIME_PERMISSION_KEY = 'screen_time_permission_granted';

export interface ScreenTimeData {
  screenTime: number;       // total hours today
  lateNightUsage: number;   // hours after 11 PM
}

/**
 * Screen Time Service
 * 
 * Uses our local Expo native module (ExpoScreenTime) to access Android UsageStatsManager natively.
 */
class ScreenTimeService {
  private permissionGranted: boolean = false;

  /**
   * Check if screen time permission has been granted
   */
  async checkPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    
    try {
      // Direct call to native Android module check
      this.permissionGranted = await ExpoScreenTime.checkPermission();
      
      // Keep AsyncStorage in sync if needed for UI cache
      await AsyncStorage.setItem(SCREEN_TIME_PERMISSION_KEY, this.permissionGranted ? 'true' : 'false');
      
      return this.permissionGranted;
    } catch (e) {
      console.error("Failed to check screen time permission natively", e);
      return false;
    }
  }

  /**
   * Request screen time permission
   * On Android, this opens Usage Access settings
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Supported', 'Screen time tracking is only available on Android.');
      return false;
    }

    try {
      // Invokes native intent to Settings.ACTION_USAGE_ACCESS_SETTINGS
      await ExpoScreenTime.requestPermission();
      return true; // The user has been redirected; verification happens upon their return
    } catch (e) {
      console.error("Failed to request native permission", e);
      return false;
    }
  }

  /**
   * Get today's screen time data natively from UsageStatsManager.
   */
  async getScreenTimeData(): Promise<ScreenTimeData> {
    const hasPermission = await this.checkPermission();
    
    if (!hasPermission) {
      return { screenTime: 0, lateNightUsage: 0 };
    }

    try {
      const data = await ExpoScreenTime.getScreenTimeData();
      return {
        screenTime: Math.max(0, data.screenTime),
        lateNightUsage: Math.max(0, data.lateNightUsage),
      };
    } catch (e) {
      console.error("Failed to get native screen time data", e);
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
