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
import {useTheme, ThemeColors} from '../context/ThemeContext';

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
  const {colors} = useTheme();
  const styles = useStyles(colors);

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

  const getButtonTextStyle = () => {
    if (isThisDeviceConnected) return [styles.buttonText, styles.buttonTextConnected];
    if (connectionStatus === 'failed') return [styles.buttonText, styles.buttonTextFailed];
    if (isThisDeviceConnecting) return [styles.buttonText, styles.buttonTextConnecting];
    return [styles.buttonText, styles.buttonTextDefault];
  };

  return (
    <View style={styles.container}>
      {/* Bluetooth icon indicator */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🔵</Text>
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
          <ActivityIndicator size="small" color={colors.buttonDisabledText} />
        ) : (
          <Text style={getButtonTextStyle()}>{getButtonText()}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const useStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  icon: {
    fontSize: 16,
    color: colors.text,
  },
  infoContainer: {
    flex: 1,
    marginRight: 12,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  deviceAddress: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonDefault: {
    backgroundColor: colors.buttonDefaultBg,
    borderColor: colors.buttonDefaultBorder,
  },
  buttonConnecting: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  buttonConnected: {
    backgroundColor: colors.background,
    borderColor: colors.primary,
  },
  buttonFailed: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttonTextDefault: {
    color: colors.buttonDefaultText,
  },
  buttonTextConnecting: {
    color: colors.buttonDisabledText,
  },
  buttonTextConnected: {
    color: colors.text,
  },
  buttonTextFailed: {
    color: colors.text,
  },
});

export default DeviceListItem;
