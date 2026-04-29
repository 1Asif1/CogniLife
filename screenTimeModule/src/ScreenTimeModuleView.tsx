import { requireNativeView } from 'expo';
import * as React from 'react';

import { ScreenTimeModuleViewProps } from './ScreenTimeModule.types';

const NativeView: React.ComponentType<ScreenTimeModuleViewProps> =
  requireNativeView('ScreenTimeModule');

export default function ScreenTimeModuleView(props: ScreenTimeModuleViewProps) {
  return <NativeView {...props} />;
}
