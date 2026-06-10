/**
 * Type definitions for the Robot Car Controller app.
 */

/** Represents a Bluetooth device discovered during scanning */
export interface BluetoothDeviceInfo {
  name: string;
  address: string; // MAC address
  id: string; // Usually same as address for Android
}

/** Connection lifecycle states */
export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'failed';

/** All valid ASCII commands sent to the robot car */
export type Command = 'F' | 'B' | 'L' | 'R' | 'S' | '1' | '0';

/** Direction commands subset (used by D-pad) */
export type DirectionCommand = 'F' | 'B' | 'L' | 'R';

/** Navigation parameter types for React Navigation */
export type RootStackParamList = {
  Connection: undefined;
  Controller: {
    deviceName: string;
    deviceAddress: string;
  };
};
