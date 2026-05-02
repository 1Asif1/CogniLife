// Reexport the native module. On web, it will be resolved to ExpoScreenTimeModule.web.ts
// and on native platforms to ExpoScreenTimeModule.ts
export { default } from './src/ExpoScreenTimeModule';
export { default as ExpoScreenTimeView } from './src/ExpoScreenTimeView';
export * from  './src/ExpoScreenTime.types';
