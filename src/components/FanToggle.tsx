/**
 * FanToggle — A prominent toggle switch for the robot car's fan.
 *
 * Visual states:
 * - ON:  Glowing blue with animated indicator
 * - OFF: Muted grey
 *
 * Sends '1' (fan on) or '0' (fan off) via the onToggle callback.
 */

import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Vibration,
} from 'react-native';
import {useTheme, ThemeColors} from '../context/ThemeContext';

interface FanToggleProps {
  isOn: boolean;
  onToggle: (newState: boolean) => void;
  disabled?: boolean;
}

const FanToggle: React.FC<FanToggleProps> = ({
  isOn,
  onToggle,
  disabled = false,
}) => {
  const {colors} = useTheme();
  const styles = useStyles(colors);

  // Animation value for the toggle knob position
  const slideAnim = useRef(new Animated.Value(isOn ? 1 : 0)).current;
  // Animation value for the glow effect
  const glowAnim = useRef(new Animated.Value(isOn ? 1 : 0)).current;
  // Pulsating animation for the ON state
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // Spinning animation for the mechanical propeller icon
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoop = useRef<Animated.CompositeAnimation | null>(null);

  // Animate the toggle when state changes
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: isOn ? 1 : 0,
        useNativeDriver: false,
        tension: 60,
        friction: 8,
      }),
      Animated.timing(glowAnim, {
        toValue: isOn ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();

    // Pulsating glow when ON
    if (isOn) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Spin propeller when active
      spinAnim.setValue(0);
      spinLoop.current = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      );
      spinLoop.current.start();
    } else {
      pulseAnim.setValue(1);
      if (spinLoop.current) {
        spinLoop.current.stop();
        spinLoop.current = null;
      }
      spinAnim.setValue(0);
    }
  }, [isOn, slideAnim, glowAnim, pulseAnim, spinAnim]);

  const handleToggle = () => {
    if (disabled) return;
    Vibration.vibrate(40);
    onToggle(!isOn);
  };

  // Interpolate colors and positions
  const trackColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.fanTrackOff, colors.fanTrackOn],
  });

  const knobTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 46], // Moves knob from left to right
  });

  const knobColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.fanKnobOff, colors.fanKnobOn],
  });

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.fanBorderOff, colors.fanBorderOn],
  });

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {transform: [{scale: pulseAnim}]},
        disabled && styles.containerDisabled,
      ]}>
      {/* Mechanical fan icon with rotation */}
      <View style={styles.labelRow}>
        <Animated.View style={{transform: [{rotate: spin}], marginRight: 8}}>
          <Text style={[styles.fanIcon, isOn ? styles.fanIconOn : styles.fanIconOff]}>
            ✇
          </Text>
        </Animated.View>
        <Text style={[styles.label, isOn && styles.labelOn]}>FAN</Text>
      </View>

      {/* Toggle track */}
      <TouchableOpacity
        onPress={handleToggle}
        disabled={disabled}
        activeOpacity={0.8}>
        <Animated.View
          style={[
            styles.track,
            {
              backgroundColor: trackColor,
              borderColor: borderColor,
            },
          ]}>
          {/* Knob */}
          <Animated.View
            style={[
              styles.knob,
              {
                backgroundColor: knobColor,
                transform: [{translateX: knobTranslateX}],
              },
            ]}
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Status label */}
      <Text style={[styles.statusText, isOn ? styles.statusOn : styles.statusOff]}>
        {isOn ? 'ON' : 'OFF'}
      </Text>
    </Animated.View>
  );
};

const useStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  containerDisabled: {
    opacity: 0.4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  fanIcon: {
    fontSize: 24,
  },
  fanIconOn: {
    color: colors.fanTextOn,
  },
  fanIconOff: {
    color: colors.fanTextOff,
  },
  label: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 3,
    fontFamily: 'monospace',
  },
  labelOn: {
    color: colors.text,
  },
  track: {
    width: 84,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    justifyContent: 'center',
    position: 'relative',
  },
  knob: {
    width: 34,
    height: 34,
    borderRadius: 17,
    position: 'absolute',
    // Glow effect for the knob
    shadowColor: colors.text,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  statusText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  statusOn: {
    color: colors.text,
  },
  statusOff: {
    color: colors.textMuted,
  },
});

export default FanToggle;
