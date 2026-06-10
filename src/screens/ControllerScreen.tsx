/**
 * ControllerScreen — Main robot car control interface.
 *
 * Features:
 * - Header with connected device name and disconnect button
 * - Connection status indicator (colored dot)
 * - D-pad for directional control (send on press, stop on release)
 * - Fan toggle (ON/OFF with safety enforcement)
 * - Toast feedback on command send failure
 *
 * Safety Logic:
 * If the fan is OFF and a movement button is pressed, the fan is
 * automatically turned ON first, then the movement command is sent.
 * This prevents the car from moving without the fan running.
 *
 * Disconnect Handling:
 * If the Bluetooth connection drops unexpectedly, an Alert is shown
 * and the user is navigated back to the ConnectionScreen.
 */

import React, {useState, useCallback, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StatusBar,
  Animated,
  StyleSheet,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {useBluetoothContext} from '../context/BluetoothContext';
import DPad from '../components/DPad';
import FanToggle from '../components/FanToggle';
import {COMMANDS} from '../constants/commands';
import {RootStackParamList} from '../types';

type ControllerScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Controller'>;
  route: RouteProp<RootStackParamList, 'Controller'>;
};

/**
 * Simple toast component that slides in from top.
 * Used to show command send failures without disrupting the control flow.
 */
const Toast: React.FC<{message: string; visible: boolean}> = ({
  message,
  visible,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.delay(2000),
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toast, {transform: [{translateY}]}]}>
      <Text style={styles.toastIcon}>⚠️</Text>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

const ControllerScreen: React.FC<ControllerScreenProps> = ({
  navigation,
  route,
}) => {
  const {deviceName, deviceAddress} = route.params;
  const {sendCommand, disconnect, connectionStatus} = useBluetoothContext();

  const [isFanOn, setIsFanOn] = useState<boolean>(false);
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [lastCommand, setLastCommand] = useState<string>('—');

  // Pulsing animation for the connection indicator dot
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (connectionStatus === 'connected') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [connectionStatus, pulseAnim]);

  /**
   * Handle unexpected disconnection.
   * Show an alert and navigate back to the ConnectionScreen.
   */
  useEffect(() => {
    if (connectionStatus === 'idle' || connectionStatus === 'failed') {
      // Only show alert if we were previously connected (not on initial mount)
      // We check if we're on the Controller screen by checking if deviceAddress exists
      if (deviceAddress) {
        Alert.alert(
          'Connection Lost',
          'The Bluetooth connection was lost. Please reconnect.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Connection'),
            },
          ],
          {cancelable: false},
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionStatus]);

  /**
   * Show a toast notification for errors.
   */
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    // Reset after animation completes
    setTimeout(() => setToastVisible(false), 3000);
  }, []);

  /**
   * Send a command via Bluetooth with error handling.
   */
  const handleSendCommand = useCallback(
    async (command: string) => {
      const success = await sendCommand(command as any);
      if (success) {
        setLastCommand(command);
      } else {
        showToast(`Failed to send command: ${command}`);
      }
    },
    [sendCommand, showToast],
  );

  /**
   * Fan toggle handler.
   * Sends '1' for ON, '0' for OFF.
   */
  const handleFanToggle = useCallback(
    async (newState: boolean) => {
      const command = newState ? COMMANDS.FAN_ON : COMMANDS.FAN_OFF;
      const success = await sendCommand(command as any);
      if (success) {
        setIsFanOn(newState);
        setLastCommand(newState ? 'Fan ON' : 'Fan OFF');
      } else {
        showToast('Failed to toggle fan');
      }
    },
    [sendCommand, showToast],
  );

  /**
   * Safety enforcement: ensure fan is ON before movement.
   * Called by DPad's onBeforeMove prop before each directional command.
   *
   * If the fan is currently OFF, this function automatically sends
   * the fan-on command ('1') and updates state BEFORE the movement
   * command is sent. This prevents the car from moving without
   * active cooling from the fan.
   */
  const handleBeforeMove = useCallback(async () => {
    if (!isFanOn) {
      const success = await sendCommand(COMMANDS.FAN_ON as any);
      if (success) {
        setIsFanOn(true);
        setLastCommand('Fan ON (auto)');
      }
    }
  }, [isFanOn, sendCommand]);

  /**
   * Handle directional command from D-pad.
   */
  const handleDirectionCommand = useCallback(
    (command: string) => {
      handleSendCommand(command);
    },
    [handleSendCommand],
  );

  /**
   * Handle stop command (sent on button release).
   */
  const handleStop = useCallback(() => {
    handleSendCommand(COMMANDS.STOP);
  }, [handleSendCommand]);

  /**
   * Intentional disconnect.
   */
  const handleDisconnect = useCallback(async () => {
    await disconnect();
    navigation.navigate('Connection');
  }, [disconnect, navigation]);

  const isConnected = connectionStatus === 'connected';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

      {/* Toast notification */}
      <Toast message={toastMessage} visible={toastVisible} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Connection status indicator dot */}
          <Animated.View
            style={[
              styles.connectionDot,
              isConnected ? styles.dotConnected : styles.dotDisconnected,
              {transform: [{scale: pulseAnim}]},
            ]}
          />
          <View>
            <Text style={styles.deviceName} numberOfLines={1}>
              {deviceName}
            </Text>
            <Text style={styles.connectionLabel}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.disconnectButton}
          onPress={handleDisconnect}
          activeOpacity={0.7}>
          <Text style={styles.disconnectIcon}>⏏</Text>
          <Text style={styles.disconnectText}>Disconnect</Text>
        </TouchableOpacity>
      </View>

      {/* Main control area */}
      <View style={styles.controlArea}>
        {/* Last command display */}
        <View style={styles.commandDisplay}>
          <Text style={styles.commandLabel}>LAST COMMAND</Text>
          <Text style={styles.commandValue}>{lastCommand}</Text>
        </View>

        {/* D-Pad */}
        <View style={styles.dpadContainer}>
          <DPad
            onCommand={handleDirectionCommand}
            onStop={handleStop}
            onBeforeMove={handleBeforeMove}
            disabled={!isConnected}
          />
        </View>

        {/* Fan Toggle */}
        <View style={styles.fanContainer}>
          <FanToggle
            isOn={isFanOn}
            onToggle={handleFanToggle}
            disabled={!isConnected}
          />
        </View>

        {/* Safety hint */}
        <View style={styles.safetyHint}>
          <Text style={styles.safetyIcon}>🛡️</Text>
          <Text style={styles.safetyText}>
            Fan auto-enables before movement for safety
          </Text>
        </View>
      </View>

      {/* Connection status bar at bottom */}
      <View
        style={[
          styles.bottomBar,
          isConnected ? styles.bottomBarConnected : styles.bottomBarDisconnected,
        ]}>
        <View
          style={[
            styles.bottomDot,
            isConnected ? styles.dotConnected : styles.dotDisconnected,
          ]}
        />
        <Text style={styles.bottomBarText}>
          {isConnected
            ? `Connected to ${deviceAddress}`
            : 'Connection lost'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  // Toast styles
  toast: {
    position: 'absolute',
    top: 50,
    left: 24,
    right: 24,
    backgroundColor: '#E17055',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
    shadowColor: '#E17055',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  toastIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#13132B',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E38',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  connectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  dotConnected: {
    backgroundColor: '#00B894',
  },
  dotDisconnected: {
    backgroundColor: '#E17055',
  },
  deviceName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    maxWidth: 180,
  },
  connectionLabel: {
    fontSize: 12,
    color: '#8888AA',
    marginTop: 2,
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(225, 112, 85, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(225, 112, 85, 0.3)',
  },
  disconnectIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  disconnectText: {
    color: '#E17055',
    fontSize: 13,
    fontWeight: '700',
  },
  // Control area
  controlArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  commandDisplay: {
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#1E1E2E',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  commandLabel: {
    fontSize: 10,
    color: '#8888AA',
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  commandValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#A29BFE',
    fontFamily: 'monospace',
  },
  dpadContainer: {
    marginVertical: 10,
  },
  fanContainer: {
    marginTop: 20,
    width: '60%',
  },
  safetyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.2)',
  },
  safetyIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  safetyText: {
    fontSize: 12,
    color: '#A29BFE',
    fontWeight: '500',
  },
  // Bottom status bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  bottomBarConnected: {
    backgroundColor: 'rgba(0, 184, 148, 0.08)',
    borderTopColor: 'rgba(0, 184, 148, 0.2)',
  },
  bottomBarDisconnected: {
    backgroundColor: 'rgba(225, 112, 85, 0.08)',
    borderTopColor: 'rgba(225, 112, 85, 0.2)',
  },
  bottomDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  bottomBarText: {
    fontSize: 12,
    color: '#8888AA',
    fontWeight: '500',
    fontFamily: 'monospace',
  },
});

export default ControllerScreen;
