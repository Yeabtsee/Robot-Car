/**
 * App.tsx — Root component with React Navigation stack.
 *
 * Navigation flow:
 *   ConnectionScreen (initial) → ControllerScreen (after BT connect)
 *
 * Uses a dark theme throughout and provides the Bluetooth context
 * via a shared provider pattern.
 */

import React from 'react';
import {StatusBar, StyleSheet} from 'react-native';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {BluetoothProvider} from './src/context/BluetoothContext';
import ConnectionScreen from './src/screens/ConnectionScreen';
import ControllerScreen from './src/screens/ControllerScreen';
import {RootStackParamList} from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Custom dark theme for React Navigation */
const DarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6C5CE7',
    background: '#0D0D1A',
    card: '#13132B',
    text: '#E4E4F0',
    border: '#1E1E38',
    notification: '#E17055',
  },
};

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />
      <BluetoothProvider>
        <NavigationContainer theme={DarkTheme}>
          <Stack.Navigator
            initialRouteName="Connection"
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              contentStyle: styles.screenContent,
            }}>
            <Stack.Screen
              name="Connection"
              component={ConnectionScreen}
              options={{
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="Controller"
              component={ControllerScreen}
              options={{
                gestureEnabled: false,
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </BluetoothProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    backgroundColor: '#0D0D1A',
  },
});

export default App;
