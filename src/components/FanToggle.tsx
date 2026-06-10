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
  // Animation value for the toggle knob position
  const slideAnim = useRef(new Animated.Value(isOn ? 1 : 0)).current;
  // Animation value for the glow effect
  const glowAnim = useRef(new Animated.Value(isOn ? 1 : 0)).current;
  // Pulsating animation for the ON state
  const pulseAnim = useRef(new Animated.Value(1)).current;

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
            toValue: 1.08,
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
    } else {
      pulseAnim.setValue(1);
    }
  }, [isOn, slideAnim, glowAnim, pulseAnim]);

  const handleToggle = () => {
    if (disabled) return;
    Vibration.vibrate(40);
    onToggle(!isOn);
  };

  // Interpolate colors and positions
  const trackColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#2A2A3E', '#1A3A5C'],
  });

  const knobTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 46], // Moves knob from left to right
  });

  const knobColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#555566', '#00B4FF'],
  });

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#3D3D56', '#00B4FF'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {transform: [{scale: pulseAnim}]},
        disabled && styles.containerDisabled,
      ]}>
      {/* Fan icon */}
      <View style={styles.labelRow}>
        <Text style={[styles.fanIcon, isOn && styles.fanIconOn]}>
          {isOn ? '🌀' : '💨'}
        </Text>
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

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#1E1E2E',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A3E',
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
    marginRight: 8,
  },
  fanIconOn: {
    // The emoji changes, no additional styling needed
  },
  label: {
    fontSize: 18,
    fontWeight: '800',
    color: '#8888AA',
    letterSpacing: 3,
  },
  labelOn: {
    color: '#00B4FF',
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
    shadowColor: '#00B4FF',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  statusText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  statusOn: {
    color: '#00B4FF',
  },
  statusOff: {
    color: '#555566',
  },
});

export default FanToggle;
