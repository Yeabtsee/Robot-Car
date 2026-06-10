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

type ConnectionScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Connection'>;
};

const ConnectionScreen: React.FC<ConnectionScreenProps> = ({navigation}) => {
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
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📱</Text>
      <Text style={styles.emptyTitle}>No Paired Devices Found</Text>
      <Text style={styles.emptySubtitle}>
        Pair your HC-05/HC-06 Bluetooth module in{'\n'}Android Settings → Bluetooth first.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerIcon}>🤖</Text>
          <View>
            <Text style={styles.headerTitle}>Josi's Robot Car</Text>
            <Text style={styles.headerSubtitle}>Bluetooth Controller</Text>
          </View>
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
            {isBluetoothEnabled ? 'Bluetooth ON' : 'Bluetooth OFF'}
          </Text>
        </View>
      </View>

      {/* Scan button */}
      <TouchableOpacity
        style={styles.scanButton}
        onPress={handleRescan}
        disabled={isScanning}
        activeOpacity={0.7}>
        {isScanning ? (
          <View style={styles.scanButtonContent}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.scanButtonText}>Scanning...</Text>
          </View>
        ) : (
          <View style={styles.scanButtonContent}>
            <Text style={styles.scanButtonIcon}>🔍</Text>
            <Text style={styles.scanButtonText}>Scan Paired Devices</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Device count */}
      {devices.length > 0 && (
        <Text style={styles.deviceCount}>
          {devices.length} device{devices.length !== 1 ? 's' : ''} found
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#13132B',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E38',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    fontSize: 36,
    marginRight: 14,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8888AA',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusEnabled: {
    backgroundColor: 'rgba(0, 184, 148, 0.15)',
    borderColor: 'rgba(0, 184, 148, 0.3)',
  },
  statusDisabled: {
    backgroundColor: 'rgba(225, 112, 85, 0.15)',
    borderColor: 'rgba(225, 112, 85, 0.3)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dotEnabled: {
    backgroundColor: '#00B894',
  },
  dotDisabled: {
    backgroundColor: '#E17055',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E4E4F0',
  },
  scanButton: {
    marginHorizontal: 24,
    marginTop: 20,
    paddingVertical: 14,
    backgroundColor: '#6C5CE7',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  scanButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  deviceCount: {
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 8,
    fontSize: 13,
    color: '#8888AA',
    fontWeight: '600',
    textTransform: 'uppercase',
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
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E4E4F0',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8888AA',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ConnectionScreen;
