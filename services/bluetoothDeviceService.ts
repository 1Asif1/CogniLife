import AsyncStorage from '@react-native-async-storage/async-storage';

let bleManager: any = null;
let Device: any = null;
let isNativeModuleAvailable = false;

try {
  const bleModule = require('react-native-ble-plx');
  bleManager = new bleModule.BleManager();
  Device = bleModule.Device;
  isNativeModuleAvailable = true;
} catch (error) {
  console.log('react-native-ble-plx not available, using mock implementation');
  isNativeModuleAvailable = false;
}

interface ConnectedDevice {
  id: string;
  name: string | null;
  connectedAt: string;
}

class BluetoothDeviceService {
  private isScanning = false;
  private connectedDevices: ConnectedDevice[] = [];

  async requestPermissions(): Promise<boolean> {
    try {
      // For Android, we need to request location permissions for BLE
      // For iOS, permissions are handled differently
      // This is a simplified version - in production, you'd use proper permission handling
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  async startScan(
    onDeviceFound: (device: any) => void,
    timeout: number = 10000
  ): Promise<void> {
    if (this.isScanning) {
      console.log('Scan already in progress');
      return;
    }

    // Use mock implementation if native module is not available
    if (!isNativeModuleAvailable) {
      this.startMockScan(onDeviceFound, timeout);
      return;
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Bluetooth permissions not granted');
    }

    this.isScanning = true;

    bleManager.startDeviceScan(
      null,
      null,
      (error: any, device: any) => {
        if (error) {
          console.error('Scan error:', error);
          this.stopScan();
          return;
        }

        if (device && device.name) {
          // Filter for common health/wearable devices
          const healthDeviceKeywords = [
            'Mi Band',
            'Fitbit',
            'Apple Watch',
            'Garmin',
            'Samsung',
            'Huawei',
            'Polar',
            'Withings',
            'Watch',
            'Band',
            'Fitness',
            'Heart Rate',
          ];

          const isHealthDevice = healthDeviceKeywords.some(keyword =>
            device.name?.toLowerCase().includes(keyword.toLowerCase())
          );

          if (isHealthDevice) {
            onDeviceFound(device);
          }
        }
      }
    );

    // Stop scan after timeout
    setTimeout(() => {
      this.stopScan();
    }, timeout);
  }

  private startMockScan(onDeviceFound: (device: any) => void, timeout: number): void {
    this.isScanning = true;
    
    // Simulate finding devices after a delay
    setTimeout(() => {
      const mockDevices = [
        { id: 'mock-1', name: 'Mi Band 7' },
        { id: 'mock-2', name: 'Fitbit Charge 5' },
        { id: 'mock-3', name: 'Apple Watch Series 8' },
      ];
      
      // Randomly select one device to "find"
      const randomDevice = mockDevices[Math.floor(Math.random() * mockDevices.length)];
      onDeviceFound(randomDevice);
      
      setTimeout(() => {
        this.stopScan();
      }, 1000);
    }, 2000);
  }

  stopScan(): void {
    if (this.isScanning) {
      if (isNativeModuleAvailable) {
        bleManager.stopDeviceScan();
      }
      this.isScanning = false;
    }
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    // Use mock implementation if native module is not available
    if (!isNativeModuleAvailable) {
      return this.mockConnectToDevice(deviceId);
    }

    try {
      const device = await bleManager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();
      
      const connectedDevice: ConnectedDevice = {
        id: device.id,
        name: device.name,
        connectedAt: new Date().toISOString(),
      };

      this.connectedDevices.push(connectedDevice);
      await this.saveConnectedDevices();

      return true;
    } catch (error) {
      console.error('Connection failed:', error);
      return false;
    }
  }

  private async mockConnectToDevice(deviceId: string): Promise<boolean> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockDevices: { [key: string]: string } = {
      'mock-1': 'Mi Band 7',
      'mock-2': 'Fitbit Charge 5',
      'mock-3': 'Apple Watch Series 8',
    };

    const deviceName = mockDevices[deviceId] || 'Unknown Device';
    
    const connectedDevice: ConnectedDevice = {
      id: deviceId,
      name: deviceName,
      connectedAt: new Date().toISOString(),
    };

    this.connectedDevices.push(connectedDevice);
    await this.saveConnectedDevices();

    return true;
  }

  async disconnectFromDevice(deviceId: string): Promise<void> {
    try {
      if (isNativeModuleAvailable) {
        await bleManager.cancelDeviceConnection(deviceId);
      }
      this.connectedDevices = this.connectedDevices.filter(d => d.id !== deviceId);
      await this.saveConnectedDevices();
    } catch (error) {
      console.error('Disconnection failed:', error);
    }
  }

  async getConnectedDevices(): Promise<ConnectedDevice[]> {
    try {
      const stored = await AsyncStorage.getItem('connectedDevices');
      if (stored) {
        this.connectedDevices = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load connected devices:', error);
    }
    return this.connectedDevices;
  }

  private async saveConnectedDevices(): Promise<void> {
    try {
      await AsyncStorage.setItem('connectedDevices', JSON.stringify(this.connectedDevices));
    } catch (error) {
      console.error('Failed to save connected devices:', error);
    }
  }

  destroy(): void {
    bleManager.destroy();
  }
}

export const bluetoothDeviceService = new BluetoothDeviceService();
