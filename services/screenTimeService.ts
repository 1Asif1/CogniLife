import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─── Lazy native module loader ────────────────────────────────────────────────
// We NEVER import ScreenTimeModule at the top level because on Web (and iOS)
// the native module doesn't exist and Metro will throw
// "Cannot find native module 'ScreenTimeModule'" before any runtime check runs.
//
// Instead we require() it inside a function that is only called on Android.
const getScreenTimeModule = (): any | null => {
  if (Platform.OS !== 'android') return null;
  try {
    // Dynamic require keeps the module out of the Web/iOS bundle graph
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { requireNativeModule } = require('expo-modules-core');
    // Try the canonical name first, then a legacy/alternate name.
    let mod: any = null;
    try {
      mod = requireNativeModule('ScreenTimeModule');
    } catch (e) {
      try {
        mod = requireNativeModule('ExpoScreenTime');
      } catch (e2) {
        mod = null;
      }
    }
    console.log('[ScreenTimeService] getScreenTimeModule loaded:', !!mod);
    return mod;
  } catch (e) {
    console.error('[ScreenTimeService] Failed to load ScreenTimeModule/ExpoScreenTime:', e);
    return null;
  }
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConfirmDialog = (config: {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}) => Promise<boolean>;

export interface ScreenTimeData {
  screenTime: number;      // total hours today  (decimal, e.g. 3.5)
  lateNightUsage: number;  // hours after 11 PM  (decimal)
}

const SCREEN_TIME_PERMISSION_KEY = 'screen_time_permission_granted';

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * ScreenTimeService
 *
 * • Android  – reads real data from the native UsageStatsManager module.
 * • Web/iOS  – all methods return safe no-op values so the rest of the app
 *              (including the multilingual Daily-Log screen) continues to work
 *              without modification.
 */
class ScreenTimeService {
  private permissionGranted: boolean = false;

  // ── isAvailable ────────────────────────────────────────────────────────────

  isAvailable(): boolean {
    return Platform.OS === 'android';
  }

  // ── checkPermission ────────────────────────────────────────────────────────

  async checkPermission(): Promise<boolean> {
    if (!this.isAvailable()) return false;

    const mod = getScreenTimeModule();
    if (!mod) return false;

    try {
      // If getUsageStats() resolves, UsageStats permission is active.
      await mod.getUsageStats();
      this.permissionGranted = true;
      await AsyncStorage.setItem(SCREEN_TIME_PERMISSION_KEY, 'true');
      return true;
    } catch {
      // Fall back to the last-known stored value so we don't lose state on
      // a transient error.
      const stored = await AsyncStorage.getItem(SCREEN_TIME_PERMISSION_KEY);
      this.permissionGranted = stored === 'true';
      return this.permissionGranted;
    }
  }

  // ── requestPermission ──────────────────────────────────────────────────────

  async requestPermission(showConfirm?: ConfirmDialog): Promise<boolean> {
    if (!this.isAvailable()) return false;

    const confirmed = showConfirm
      ? await showConfirm({
          title: '📱 Screen Time Access',
          message:
            'CogniLife needs access to your usage data to track screen time and late-night phone usage. This helps us provide better health insights.',
          confirmText: 'Open Settings',
          cancelText: 'Not Now',
        })
      : true;

    if (!confirmed) return false;

    try {
      const mod = getScreenTimeModule();
      if (mod && mod.openSettings) {
        await mod.openSettings();
        return true;
      }
      
      // Fallback to general settings
      const { Linking } = require('react-native');
      await Linking.openSettings();
      return true;
    } catch {
      return false;
    }
  }

  // ── getScreenTimeData ──────────────────────────────────────────────────────

  async getScreenTimeData(): Promise<ScreenTimeData> {
    if (!this.isAvailable()) return { screenTime: 0, lateNightUsage: 0 };

    const mod = getScreenTimeModule();
    if (!mod) return { screenTime: 0, lateNightUsage: 0 };

    try {
      const data = await mod.getUsageStats();

      // Native module returns MINUTES – convert to decimal hours for the ML pipeline
      console.log(
        '[ScreenTime] Raw from native (minutes):',
        data.screenTime,
        'late:',
        data.lateNightUsage,
      );

      const result: ScreenTimeData = {
        screenTime: Number((data.screenTime / 60).toFixed(2)),
        lateNightUsage: Number((data.lateNightUsage / 60).toFixed(2)),
      };

      console.log(
        '[ScreenTime] Converted to hours:',
        result.screenTime,
        'late:',
        result.lateNightUsage,
      );

      return result;
    } catch (e) {
      console.error('ScreenTimeModule Error:', e);
      return { screenTime: 0, lateNightUsage: 0 };
    }
  }

  // ── formatDuration ─────────────────────────────────────────────────────────

  /** Converts decimal hours → human-readable string, e.g. 6.48 → "6h 29m" */
  formatDuration(hours: number): string {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  }
}

export const screenTimeService = new ScreenTimeService();