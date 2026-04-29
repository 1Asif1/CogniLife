import { registerWebModule, NativeModule } from 'expo';

import { ScreenTimeModuleEvents } from './ScreenTimeModule.types';

class ScreenTimeModule extends NativeModule<ScreenTimeModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(ScreenTimeModule, 'ScreenTimeModule');
