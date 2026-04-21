import { Platform, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    
    try {
      const stored = await AsyncStorage.getItem(SCREEN_TIME_PERMISSION_KEY);
      this.permissionGranted = stored === 'true';
      return this.permissionGranted;
    } catch {
      return false;
    }
  }

  /**
   * Request screen time permission
   * On Android, this opens Usage Access settings where user must manually enable
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Supported', 'Screen time tracking is only available on Android.');
      return false;
    }

    return new Promise((resolve) => {
      Alert.alert(
        '📱 Screen Time Access',
        'CogniLife needs access to your usage data to track screen time and late-night phone usage. This helps us provide better health insights.\n\nYou\'ll be taken to Settings where you need to find and enable CogniLife.',
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Open Settings',
            onPress: async () => {
              try {
                // On a real native module, this would open:
                // android.provider.Settings.ACTION_USAGE_ACCESS_SETTINGS
                await Linking.openSettings();
                
                // Mark as granted (user confirmed they went to settings)
                // In real implementation, we'd verify via native module
                await AsyncStorage.setItem(SCREEN_TIME_PERMISSION_KEY, 'true');
                this.permissionGranted = true;
                resolve(true);
              } catch {
                resolve(false);
              }
            },
          },
        ]
      );
    });
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

    // Simulated data based on time of day
    // Replace with actual native module call:
    // const stats = await NativeScreenTimeModule.getUsageStats(startOfDay, now);
    const now = new Date();
    const hoursElapsed = now.getHours() + now.getMinutes() / 60;
    
    // Estimate ~40% of waking hours as screen time
    const estimatedScreenTime = Math.round((hoursElapsed * 0.4) * 10) / 10;
    
    // Late night usage: estimate based on whether it's past 11 PM
    const lateNightHours = now.getHours() >= 23 
      ? (now.getHours() - 23 + now.getMinutes() / 60) 
      : 0;

    return {
      screenTime: Math.max(0, estimatedScreenTime),
      lateNightUsage: Math.round(lateNightHours * 10) / 10,
    };
  }

  /**
   * Check if the service is available on this platform
   */
  isAvailable(): boolean {
    return Platform.OS === 'android';
  }
}

export const screenTimeService = new ScreenTimeService();
