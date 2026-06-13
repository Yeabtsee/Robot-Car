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
import {useTheme, ThemeColors} from '../context/ThemeContext';

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
  const {colors} = useTheme();
  const styles = useStyles(colors);

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
      {({pressed}) => (
        <>
          <Text style={[
            styles.buttonIcon,
            pressed && styles.buttonIconPressed,
            disabled && styles.textDisabled
          ]}>
            {icon}
          </Text>
          <Text style={[
            styles.buttonLabel,
            pressed && styles.buttonLabelPressed,
            disabled && styles.textDisabled
          ]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
};

const DPad: React.FC<DPadProps> = ({
  onCommand,
  onStop,
  onBeforeMove,
  disabled = false,
}) => {
  const {colors} = useTheme();
  const styles = useStyles(colors);

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
          {({pressed}) => (
            <>
              <Text style={[
                styles.stopIcon,
                disabled && styles.textDisabled,
                disabled && {color: colors.textMuted}
              ]}>
                ■
              </Text>
              <Text style={[
                styles.stopLabel,
                disabled && styles.textDisabled,
                disabled && {color: colors.textMuted}
              ]}>
                STOP
              </Text>
            </>
          )}
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

const useStyles = (colors: ThemeColors) => StyleSheet.create({
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
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    // Depth effect
    shadowColor: colors.text,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  directionButtonPressed: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    transform: [{scale: 0.92}],
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  directionButtonDisabled: {
    backgroundColor: colors.buttonDisabledBg,
    borderColor: colors.buttonDisabledBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
  sideButton: {
    // Side buttons need horizontal spacing from the stop button
  },
  buttonIcon: {
    fontSize: 22,
    color: colors.text,
    marginBottom: 2,
  },
  buttonIconPressed: {
    color: colors.primaryText,
  },
  buttonLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  buttonLabelPressed: {
    color: colors.primaryText,
  },
  stopButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: colors.stopButtonBg,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 6,
    borderWidth: 1.5,
    borderColor: colors.stopButtonBorder,
    shadowColor: colors.stopButtonBg,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  stopButtonPressed: {
    backgroundColor: colors.stopButtonPressedBg,
    borderColor: colors.stopButtonPressedBg,
    transform: [{scale: 0.92}],
  },
  stopIcon: {
    fontSize: 18,
    color: colors.primaryText,
    marginBottom: 2,
  },
  stopLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryText,
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  textDisabled: {
    opacity: 0.2,
  },
});

export default DPad;
