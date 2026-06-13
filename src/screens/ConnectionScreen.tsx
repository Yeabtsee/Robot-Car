/**
 * ConnectionScreen — Scan and list paired Bluetooth devices.
 *
 * Flow:
 * 1. On mount: request permissions → scan paired devices
 * 2. User taps Connect on a device
 * 3. On successful connection: auto-navigate to ControllerScreen
 *
 * Only shows PAIRED devices (bonded in Android Settings). The HC-05/HC-06
 * module should already be paired before using this app.
 */

import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useBluetoothContext} from '../context/BluetoothContext';
import DeviceListItem from '../components/DeviceListItem';
import {BluetoothDeviceInfo, RootStackParamList, ConnectionStatus} from '../types';
import {useTheme, ThemeColors} from '../context/ThemeContext';

type ConnectionScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Connection'>;
};

const ConnectionScreen: React.FC<ConnectionScreenProps> = ({navigation}) => {
  const {theme, colors, toggleTheme} = useTheme();
  const styles = useStyles(colors);

  const {
    devices,
    connectionStatus,
    isScanning,
    isBluetoothEnabled,
    requestPermissions,
    scanPairedDevices,
    connectToDevice,
    connectedDevice,
  } = useBluetoothContext();

  // Track which device address is currently being connected to
  const [connectingAddress, setConnectingAddress] = useState<string | null>(null);
  // Track per-device connection status for failed state display
  const [deviceStatuses, setDeviceStatuses] = useState<
    Record<string, ConnectionStatus>
  >({});

  // Request permissions and scan on mount
  useEffect(() => {
    const initialize = async () => {
      const granted = await requestPermissions();
      if (granted) {
        await scanPairedDevices();
      }
    };
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-navigate to Controller when connected
  useEffect(() => {
    if (connectionStatus === 'connected' && connectedDevice) {
      navigation.navigate('Controller', {
        deviceName: connectedDevice.name,
        deviceAddress: connectedDevice.address,
      });
      // Reset connecting state
      setConnectingAddress(null);
    }
  }, [connectionStatus, connectedDevice, navigation]);

  // Handle connect button press
  const handleConnect = useCallback(
    async (address: string) => {
      setConnectingAddress(address);
      setDeviceStatuses(prev => ({...prev, [address]: 'connecting'}));

      const success = await connectToDevice(address);

      if (!success) {
        setDeviceStatuses(prev => ({...prev, [address]: 'failed'}));
        setConnectingAddress(null);
      } else {
        setDeviceStatuses(prev => ({...prev, [address]: 'connected'}));
      }
    },
    [connectToDevice],
  );

  // Handle rescan
  const handleRescan = useCallback(async () => {
    setDeviceStatuses({});
    setConnectingAddress(null);
    await scanPairedDevices();
  }, [scanPairedDevices]);

  const renderDevice = ({item}: {item: BluetoothDeviceInfo}) => {
    const status = deviceStatuses[item.address] || 'idle';
    const isConnecting = connectingAddress === item.address && status === 'connecting';

    return (
      <DeviceListItem
        device={item}
        connectionStatus={status}
        isConnecting={isConnecting}
        onConnect={handleConnect}
      />
    );
  };  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>Ø</Text>
      <Text style={styles.emptyTitle}>NO DEVICES FOUND</Text>
      <Text style={styles.emptySubtitle}>
        Pair your HC-05/HC-06 Bluetooth module in{'\n'}Android Settings → Bluetooth first.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>ROBO CAR</Text>
            <Text style={styles.headerSubtitle}>[ BLUETOOTH CONTROL ]</Text>
          </View>

          {/* Theme Toggle */}
          <TouchableOpacity
            style={styles.themeToggle}
            onPress={toggleTheme}
            activeOpacity={0.7}>
            <Text style={styles.themeToggleText}>
              {theme === 'dark' ? '[ ☼ ]' : '[ ☾ ]'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bluetooth status badge */}
        <View
          style={[
            styles.statusBadge,
            isBluetoothEnabled ? styles.statusEnabled : styles.statusDisabled,
          ]}>
          <View
            style={[
              styles.statusDot,
              isBluetoothEnabled ? styles.dotEnabled : styles.dotDisabled,
            ]}
          />
          <Text style={styles.statusText}>
            {isBluetoothEnabled ? 'BLUETOOTH ON' : 'BLUETOOTH OFF'}
          </Text>
        </View>
      </View>

      {/* Scan button */}
      <TouchableOpacity
        style={styles.scanButton}
        onPress={handleRescan}
        disabled={isScanning}
        activeOpacity={0.8}>
        {isScanning ? (
          <View style={styles.scanButtonContent}>
            <ActivityIndicator size="small" color={colors.buttonDefaultText} style={{marginRight: 8}} />
            <Text style={styles.scanButtonText}>SCANNING...</Text>
          </View>
        ) : (
          <View style={styles.scanButtonContent}>
            <Text style={styles.scanButtonText}>SCAN DEVICES</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Device count */}
      {devices.length > 0 && (
        <Text style={styles.deviceCount}>
          {devices.length} DEVICE{devices.length !== 1 ? 'S' : ''} FOUND
        </Text>
      )}

      {/* Device list */}
      <FlatList
        data={devices}
        renderItem={renderDevice}
        keyExtractor={item => item.address}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={!isScanning ? renderEmptyList : null}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const useStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  themeToggle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  themeToggleText: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: colors.text,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.textMuted,
    marginTop: 4,
    letterSpacing: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusEnabled: {
    backgroundColor: 'transparent',
    borderColor: colors.badgeDotEnabled,
  },
  statusDisabled: {
    backgroundColor: 'transparent',
    borderColor: colors.badgeBorder,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  dotEnabled: {
    backgroundColor: colors.badgeDotEnabled,
  },
  dotDisabled: {
    backgroundColor: colors.badgeDotDisabled,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  scanButton: {
    marginHorizontal: 24,
    marginTop: 20,
    paddingVertical: 14,
    backgroundColor: colors.buttonDefaultBg,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.text,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.buttonDefaultBorder,
  },
  scanButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanButtonText: {
    color: colors.buttonDefaultText,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  deviceCount: {
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 8,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    flexGrow: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 32,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'monospace',
    letterSpacing: 1,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ConnectionScreen;
