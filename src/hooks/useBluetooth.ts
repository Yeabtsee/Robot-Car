/**
 * useBluetooth — Custom hook encapsulating all Bluetooth Classic logic.
 *
 * Manages device scanning, connection, disconnection, command sending,
 * and connection state monitoring. All Bluetooth calls are wrapped in
 * try/catch for safety.
 *
 * Key design decisions:
 * - Uses react-native-bluetooth-classic for SPP (Serial Port Profile)
 * - Only lists PAIRED devices (not discovered) since HC-05/HC-06 modules
 *   should be paired beforehand via Android settings
 * - Monitors connection state via onDeviceDisconnected listener
 * - sendCommand is fire-and-forget with error callback for UI feedback
 */

import {useState, useCallback, useRef, useEffect} from 'react';
import {Platform, PermissionsAndroid, Alert} from 'react-native';
import RNBluetoothClassic, {
  BluetoothDevice,
  BluetoothEventSubscription,
} from 'react-native-bluetooth-classic';
import {BluetoothDeviceInfo, ConnectionStatus, Command} from '../types';

interface UseBluetoothReturn {
  devices: BluetoothDeviceInfo[];
  connectedDevice: BluetoothDeviceInfo | null;
  connectionStatus: ConnectionStatus;
  isBluetoothEnabled: boolean;
  isScanning: boolean;
  requestPermissions: () => Promise<boolean>;
  scanPairedDevices: () => Promise<void>;
  connectToDevice: (address: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
  sendCommand: (command: Command) => Promise<boolean>;
}

export const useBluetooth = (): UseBluetoothReturn => {
  const [devices, setDevices] = useState<BluetoothDeviceInfo[]>([]);
  const [connectedDevice, setConnectedDevice] =
    useState<BluetoothDeviceInfo | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('idle');
  const [isBluetoothEnabled, setIsBluetoothEnabled] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Keep a ref to the native BluetoothDevice for sending commands.
  // We use a ref instead of state because we don't need re-renders
  // when the native device object changes — only when connectionStatus changes.
  const nativeDeviceRef = useRef<BluetoothDevice | null>(null);

  // Ref to the disconnect subscription for cleanup
  const disconnectSubscriptionRef = useRef<BluetoothEventSubscription | null>(null);

  // Callback ref for disconnect handler (set by the screen)
  const onDisconnectCallbackRef = useRef<(() => void) | null>(null);

  /**
   * Check if Bluetooth is available and enabled on the device.
   */
  const checkBluetoothState = useCallback(async () => {
    try {
      const available = await RNBluetoothClassic.isBluetoothAvailable();
      if (!available) {
        setIsBluetoothEnabled(false);
        return false;
      }
      const enabled = await RNBluetoothClassic.isBluetoothEnabled();
      setIsBluetoothEnabled(enabled);
      return enabled;
    } catch (error) {
      console.error('[BT] Error checking Bluetooth state:', error);
      setIsBluetoothEnabled(false);
      return false;
    }
  }, []);

  /**
   * Request Bluetooth and location permissions at runtime.
   * Android 12+ requires BLUETOOTH_CONNECT and BLUETOOTH_SCAN.
   * Older versions need ACCESS_FINE_LOCATION for device discovery.
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      const apiLevel = Platform.Version;

      if (apiLevel >= 31) {
        // Android 12+ needs BLUETOOTH_CONNECT and BLUETOOTH_SCAN
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        const allGranted =
          granted['android.permission.BLUETOOTH_CONNECT'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.BLUETOOTH_SCAN'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.ACCESS_FINE_LOCATION'] ===
            PermissionsAndroid.RESULTS.GRANTED;

        if (!allGranted) {
          Alert.alert(
            'Permissions Required',
            'Bluetooth and Location permissions are required to connect to the robot car.',
          );
          return false;
        }
        return true;
      } else {
        // Android < 12: only need ACCESS_FINE_LOCATION
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message:
              'This app needs location access to discover Bluetooth devices.',
            buttonPositive: 'Grant',
            buttonNegative: 'Deny',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permission Denied',
            'Location permission is required for Bluetooth device discovery.',
          );
          return false;
        }
        return true;
      }
    } catch (error) {
      console.error('[BT] Permission request error:', error);
      return false;
    }
  }, []);

  /**
   * Scan for paired (bonded) Bluetooth devices.
   * Note: We list PAIRED devices, not discovered ones. The HC-05/HC-06
   * module should be paired in Android Bluetooth settings first.
   */
  const scanPairedDevices = useCallback(async (): Promise<void> => {
    setIsScanning(true);
    try {
      const btEnabled = await checkBluetoothState();
      if (!btEnabled) {
        Alert.alert(
          'Bluetooth Disabled',
          'Please enable Bluetooth in your device settings.',
        );
        setIsScanning(false);
        return;
      }

      const paired = await RNBluetoothClassic.getBondedDevices();
      const deviceList: BluetoothDeviceInfo[] = paired.map(device => ({
        name: device.name || 'Unknown Device',
        address: device.address,
        id: device.address,
      }));

      setDevices(deviceList);
    } catch (error) {
      console.error('[BT] Error scanning paired devices:', error);
      Alert.alert(
        'Scan Error',
        'Failed to retrieve paired devices. Please check Bluetooth is enabled.',
      );
    } finally {
      setIsScanning(false);
    }
  }, [checkBluetoothState]);

  /**
   * Connect to a Bluetooth device by MAC address.
   * Sets up a disconnect listener to handle unexpected disconnections.
   * Returns true if connection was successful.
   */
  const connectToDevice = useCallback(
    async (address: string): Promise<boolean> => {
      setConnectionStatus('connecting');

      try {
        // Get the native device object by address
        const device = await RNBluetoothClassic.getConnectedDevice(address).catch(
          () => null,
        );

        let connectedNativeDevice: BluetoothDevice;

        if (device && (await device.isConnected())) {
          // Already connected — reuse the existing device reference
          connectedNativeDevice = device;
        } else {
          // Attempt connection. The library handles SPP UUID internally.
          const pairedDevices = await RNBluetoothClassic.getBondedDevices();
          const targetDevice = pairedDevices.find(d => d.address === address);

          if (!targetDevice) {
            throw new Error('Device not found in paired devices list.');
          }

          // connect() returns a boolean indicating success.
          // We keep the targetDevice reference for subsequent operations
          // (write, disconnect, isConnected) since it represents the
          // active Bluetooth socket after connection.
          const connected = await targetDevice.connect({
            delimiter: '\r\n',
          });

          if (!connected) {
            throw new Error('Connection was not established.');
          }

          connectedNativeDevice = targetDevice;
        }

        // Store the native device reference for command sending
        nativeDeviceRef.current = connectedNativeDevice;

        // Find device info from our list
        const deviceInfo = devices.find(d => d.address === address) || {
          name: connectedNativeDevice.name || 'Unknown',
          address: connectedNativeDevice.address,
          id: connectedNativeDevice.address,
        };

        setConnectedDevice(deviceInfo);
        setConnectionStatus('connected');

        // Set up disconnect listener via the module-level API.
        // RNBluetoothClassic.onDeviceDisconnected fires when any device
        // disconnects unexpectedly (out of range, Arduino powered off, etc.).
        disconnectSubscriptionRef.current =
          RNBluetoothClassic.onDeviceDisconnected(() => {
            console.warn('[BT] Device disconnected unexpectedly');
            setConnectionStatus('idle');
            setConnectedDevice(null);
            nativeDeviceRef.current = null;

            // Notify the screen to handle navigation
            if (onDisconnectCallbackRef.current) {
              onDisconnectCallbackRef.current();
            }
          });

        return true;
      } catch (error) {
        console.error('[BT] Connection error:', error);
        setConnectionStatus('failed');

        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        Alert.alert(
          'Connection Failed',
          `Could not connect to device: ${errorMessage}`,
        );
        return false;
      }
    },
    [devices],
  );

  /**
   * Disconnect from the currently connected device.
   * Clean up listeners and reset state.
   */
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      // Remove disconnect listener first to avoid triggering the
      // unexpected-disconnect handler during intentional disconnect
      if (disconnectSubscriptionRef.current) {
        disconnectSubscriptionRef.current.remove();
        disconnectSubscriptionRef.current = null;
      }

      if (nativeDeviceRef.current) {
        const isConnected = await nativeDeviceRef.current.isConnected();
        if (isConnected) {
          await nativeDeviceRef.current.disconnect();
        }
      }
    } catch (error) {
      console.error('[BT] Disconnect error:', error);
    } finally {
      nativeDeviceRef.current = null;
      setConnectedDevice(null);
      setConnectionStatus('idle');
    }
  }, []);

  /**
   * Send a single ASCII command character over the Bluetooth serial connection.
   *
   * The write() method sends data as a string through the SPP output stream.
   * The Arduino on the other end reads this as a single character from Serial.read().
   *
   * Returns true if the command was sent successfully.
   */
  const sendCommand = useCallback(async (command: Command): Promise<boolean> => {
    if (!nativeDeviceRef.current) {
      console.warn('[BT] Cannot send command: no device connected');
      return false;
    }

    try {
      // Check connection is still alive before writing
      const isConnected = await nativeDeviceRef.current.isConnected();
      if (!isConnected) {
        console.warn('[BT] Device is no longer connected');
        setConnectionStatus('idle');
        setConnectedDevice(null);
        return false;
      }

      // Send the single ASCII character.
      // device.write() sends the string through the Bluetooth output stream.
      const success = await nativeDeviceRef.current.write(command);
      return success;
    } catch (error) {
      console.error('[BT] Send command error:', error);
      return false;
    }
  }, []);

  /**
   * Set a callback to be invoked when connection drops unexpectedly.
   * Used by ControllerScreen to navigate back.
   */
  const setOnDisconnectCallback = useCallback((callback: () => void) => {
    onDisconnectCallbackRef.current = callback;
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (disconnectSubscriptionRef.current) {
        disconnectSubscriptionRef.current.remove();
      }
    };
  }, []);

  // Check Bluetooth state on mount
  useEffect(() => {
    checkBluetoothState();
  }, [checkBluetoothState]);

  return {
    devices,
    connectedDevice,
    connectionStatus,
    isBluetoothEnabled,
    isScanning,
    requestPermissions,
    scanPairedDevices,
    connectToDevice,
    disconnect,
    sendCommand,
  };
};
