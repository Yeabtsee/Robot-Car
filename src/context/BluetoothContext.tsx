/**
 * BluetoothContext — Provides shared Bluetooth state across screens.
 *
 * Since ConnectionScreen and ControllerScreen both need access to the same
 * Bluetooth connection state (device list, connected device, send commands),
 * we wrap the useBluetooth hook in a React Context so both screens share
 * a single instance of the hook's state.
 */

import React, {createContext, useContext} from 'react';
import {useBluetooth} from '../hooks/useBluetooth';

// The context type matches the return type of useBluetooth
type BluetoothContextType = ReturnType<typeof useBluetooth>;

const BluetoothContext = createContext<BluetoothContextType | null>(null);

export const BluetoothProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const bluetooth = useBluetooth();

  return (
    <BluetoothContext.Provider value={bluetooth}>
      {children}
    </BluetoothContext.Provider>
  );
};

/**
 * Hook to consume the shared Bluetooth context.
 * Must be used within a BluetoothProvider.
 */
export const useBluetoothContext = (): BluetoothContextType => {
  const context = useContext(BluetoothContext);
  if (!context) {
    throw new Error(
      'useBluetoothContext must be used within a BluetoothProvider',
    );
  }
  return context;
};
