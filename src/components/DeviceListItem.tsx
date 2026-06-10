/**
 * DeviceListItem — Renders a single Bluetooth device in the scan list.
 *
 * Shows device name, MAC address, and a connect button with visual
 * feedback for the current connection state.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {BluetoothDeviceInfo, ConnectionStatus} from '../types';

interface DeviceListItemProps {
  device: BluetoothDeviceInfo;
  connectionStatus: ConnectionStatus;
  isConnecting: boolean;
  onConnect: (address: string) => void;
}

const DeviceListItem: React.FC<DeviceListItemProps> = ({
  device,
  connectionStatus,
  isConnecting,
  onConnect,
}) => {
  const isThisDeviceConnecting = isConnecting;
  const isThisDeviceConnected = connectionStatus === 'connected';

  const getButtonText = (): string => {
    if (isThisDeviceConnecting) return 'Connecting...';
    if (isThisDeviceConnected) return 'Connected';
    if (connectionStatus === 'failed') return 'Retry';
    return 'Connect';
  };

  const getButtonStyle = () => {
    if (isThisDeviceConnected) return [styles.button, styles.buttonConnected];
    if (connectionStatus === 'failed') return [styles.button, styles.buttonFailed];
    if (isThisDeviceConnecting) return [styles.button, styles.buttonConnecting];
    return [styles.button, styles.buttonDefault];
  };

  return (
    <View style={styles.container}>
      {/* Bluetooth icon indicator */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>📡</Text>
      </View>

      {/* Device info */}
      <View style={styles.infoContainer}>
        <Text style={styles.deviceName} numberOfLines={1}>
          {device.name}
        </Text>
        <Text style={styles.deviceAddress}>{device.address}</Text>
      </View>

      {/* Connect button */}
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={() => onConnect(device.address)}
        disabled={isThisDeviceConnecting || isThisDeviceConnected}
        activeOpacity={0.7}>
        {isThisDeviceConnecting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>{getButtonText()}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A3E',
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2A2A3E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  icon: {
    fontSize: 20,
  },
  infoContainer: {
    flex: 1,
    marginRight: 12,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E4E4F0',
    marginBottom: 4,
  },
  deviceAddress: {
    fontSize: 12,
    color: '#8888AA',
    fontFamily: 'monospace',
  },
  button: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDefault: {
    backgroundColor: '#6C5CE7',
  },
  buttonConnecting: {
    backgroundColor: '#A29BFE',
  },
  buttonConnected: {
    backgroundColor: '#00B894',
  },
  buttonFailed: {
    backgroundColor: '#E17055',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default DeviceListItem;
