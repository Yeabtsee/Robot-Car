/**
 * Bluetooth configuration constants.
 *
 * SPP_UUID: Standard Serial Port Profile UUID used for Bluetooth Classic
 * serial communication. This is the universally recognized UUID for SPP
 * and must match the UUID expected by the HC-05/HC-06 Bluetooth module
 * on the Arduino side.
 */

export const SPP_UUID = '00001101-0000-1000-8000-00805F9B34FB';

/** Delimiter used for message framing (if needed by the device) */
export const MESSAGE_DELIMITER = '\r\n';

/** Connection timeout in milliseconds */
export const CONNECTION_TIMEOUT_MS = 10000;
