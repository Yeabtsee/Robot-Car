/**
 * DPad — Directional pad with Forward, Backward, Left, Right buttons
 * arranged in a cross layout with a Stop button at center.
 *
 * Key behavior:
 * - onPressIn → sends the movement command (F/B/L/R)
 * - onPressOut → sends Stop (S)
 *
 * The parent provides an `onBeforeMove` callback for safety enforcement.
 * This is used to ensure the fan is ON before any movement command is sent.
 * If the fan is OFF, onBeforeMove auto-enables it before the movement.
 */

import React, {useCallback} from 'react';
import {View, Text, Pressable, StyleSheet, Vibration} from 'react-native';
import {DirectionCommand} from '../types';
import {COMMANDS} from '../constants/commands';

interface DPadProps {
  onCommand: (command: string) => void;
  onStop: () => void;
  onBeforeMove: () => Promise<void>;
  disabled?: boolean;
}

interface DirectionButtonProps {
  label: string;
  icon: string;
  command: DirectionCommand;
  onPressIn: (command: DirectionCommand) => void;
  onPressOut: () => void;
  disabled?: boolean;
  style?: any;
}

/**
 * Individual directional button with press-in/press-out behavior.
 * Uses Pressable for the pressed visual feedback.
 */
const DirectionButton: React.FC<DirectionButtonProps> = ({
  label,
  icon,
  command,
  onPressIn,
  onPressOut,
  disabled,
  style,
}) => {
  return (
    <Pressable
      onPressIn={() => {
        if (!disabled) {
          Vibration.vibrate(30); // Haptic feedback
          onPressIn(command);
        }
      }}
      onPressOut={() => {
        if (!disabled) {
          onPressOut();
        }
      }}
      disabled={disabled}
      style={({pressed}) => [
        styles.directionButton,
        style,
        pressed && styles.directionButtonPressed,
        disabled && styles.directionButtonDisabled,
      ]}>
      <Text style={[styles.buttonIcon, disabled && styles.textDisabled]}>
        {icon}
      </Text>
      <Text style={[styles.buttonLabel, disabled && styles.textDisabled]}>
        {label}
      </Text>
    </Pressable>
  );
};

const DPad: React.FC<DPadProps> = ({
  onCommand,
  onStop,
  onBeforeMove,
  disabled = false,
}) => {
  /**
   * Handle directional button press.
   * Safety logic: calls onBeforeMove first to ensure fan is ON,
   * then sends the actual movement command.
   */
  const handlePressIn = useCallback(
    async (command: DirectionCommand) => {
      // onBeforeMove enforces fan-first safety (see ControllerScreen)
      await onBeforeMove();
      onCommand(command);
    },
    [onCommand, onBeforeMove],
  );

  const handlePressOut = useCallback(() => {
    onStop();
  }, [onStop]);

  const handleStopPress = useCallback(() => {
    Vibration.vibrate(50);
    onCommand(COMMANDS.STOP);
  }, [onCommand]);

  return (
    <View style={styles.container}>
      {/* Forward button — top center */}
      <View style={styles.row}>
        <DirectionButton
          label="FWD"
          icon="▲"
          command={COMMANDS.FORWARD as DirectionCommand}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
        />
      </View>

      {/* Middle row: Left — Stop — Right */}
      <View style={styles.row}>
        <DirectionButton
          label="LEFT"
          icon="◄"
          command={COMMANDS.LEFT as DirectionCommand}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          style={styles.sideButton}
        />

        {/* Center Stop button */}
        <Pressable
          onPress={handleStopPress}
          disabled={disabled}
          style={({pressed}) => [
            styles.stopButton,
            pressed && styles.stopButtonPressed,
            disabled && styles.directionButtonDisabled,
          ]}>
          <Text style={[styles.stopIcon, disabled && styles.textDisabled]}>
            ■
          </Text>
          <Text style={[styles.stopLabel, disabled && styles.textDisabled]}>
            STOP
          </Text>
        </Pressable>

        <DirectionButton
          label="RIGHT"
          icon="►"
          command={COMMANDS.RIGHT as DirectionCommand}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          style={styles.sideButton}
        />
      </View>

      {/* Backward button — bottom center */}
      <View style={styles.row}>
        <DirectionButton
          label="BWD"
          icon="▼"
          command={COMMANDS.BACKWARD as DirectionCommand}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
        />
      </View>
    </View>
  );
};

const BUTTON_SIZE = 76; // Minimum 70px touch targets as per spec

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  directionButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#2A2A3E',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 6,
    borderWidth: 2,
    borderColor: '#3D3D56',
    // Depth effect
    shadowColor: '#6C5CE7',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  directionButtonPressed: {
    backgroundColor: '#6C5CE7',
    borderColor: '#A29BFE',
    transform: [{scale: 0.92}],
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  directionButtonDisabled: {
    backgroundColor: '#1A1A28',
    borderColor: '#2A2A3E',
    shadowOpacity: 0,
    elevation: 0,
  },
  sideButton: {
    // Side buttons need horizontal spacing from the stop button
  },
  buttonIcon: {
    fontSize: 22,
    color: '#E4E4F0',
    marginBottom: 2,
  },
  buttonLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8888AA',
    letterSpacing: 1,
  },
  stopButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#E17055',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 6,
    borderWidth: 2,
    borderColor: '#E17055',
    shadowColor: '#E17055',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  stopButtonPressed: {
    backgroundColor: '#D63031',
    borderColor: '#FF7675',
    transform: [{scale: 0.92}],
  },
  stopIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  stopLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  textDisabled: {
    opacity: 0.3,
  },
});

export default DPad;
