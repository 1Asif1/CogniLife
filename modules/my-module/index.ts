import { requireNativeModule } from 'expo-modules-core';

// Require the native module. 
// "ExpoScreenTime" exactly matches the Name("ExpoScreenTime") in the ModuleDefinition in Kotlin
const ExpoScreenTime = requireNativeModule('ExpoScreenTime');

export async function checkPermission(): Promise<boolean> {
  return await ExpoScreenTime.checkPermission();
}

export async function requestPermission(): Promise<boolean> {
  return await ExpoScreenTime.requestPermission();
}

export async function getScreenTimeData(): Promise<{ screenTime: number, lateNightUsage: number }> {
  return await ExpoScreenTime.getScreenTimeData();
}
