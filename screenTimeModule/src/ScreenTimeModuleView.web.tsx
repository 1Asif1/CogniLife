import * as React from 'react';

import { ScreenTimeModuleViewProps } from './ScreenTimeModule.types';

export default function ScreenTimeModuleView(props: ScreenTimeModuleViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
