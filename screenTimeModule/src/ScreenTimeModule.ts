import { requireNativeModule } from 'expo-modules-core';

export type ScreenTimeData = {
  screenTime: number;
  lateNightUsage: number;
};

export default requireNativeModule<{
  getUsageStats(): Promise<ScreenTimeData>;
}>('ScreenTimeModule');