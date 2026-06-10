/**
 * ASCII command constants sent over Bluetooth to the robot car's Arduino.
 *
 * Protocol:
 *   Movement: F (forward), B (backward), L (left), R (right), S (stop)
 *   Fan:      1 (on), 0 (off)
 *
 * Arduino-side recommendation (document in firmware):
 *   Implement a 500ms watchdog timer — if no command is received within 500ms,
 *   automatically trigger STOP to prevent runaway movement in case of
 *   Bluetooth disconnection.
 */

import {Command} from '../types';

export const COMMANDS: Record<string, Command> = {
  FORWARD: 'F',
  BACKWARD: 'B',
  LEFT: 'L',
  RIGHT: 'R',
  STOP: 'S',
  FAN_ON: '1',
  FAN_OFF: '0',
} as const;

/** Human-readable labels for display purposes */
export const COMMAND_LABELS: Record<string, string> = {
  F: 'Forward',
  B: 'Backward',
  L: 'Left',
  R: 'Right',
  S: 'Stop',
  '1': 'Fan ON',
  '0': 'Fan OFF',
} as const;
