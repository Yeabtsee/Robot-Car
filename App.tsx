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
import {StatusBar} from 'react-native';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {BluetoothProvider} from './src/context/BluetoothContext';
import {ThemeProvider, useTheme} from './src/context/ThemeContext';
import ConnectionScreen from './src/screens/ConnectionScreen';
import ControllerScreen from './src/screens/ControllerScreen';
import {RootStackParamList} from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent(): React.JSX.Element {
  const {theme, colors} = useTheme();

  const navTheme = {
    ...DefaultTheme,
    dark: theme === 'dark',
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  };

  return (
    <>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          initialRouteName="Connection"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: {backgroundColor: colors.background},
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
    </>
  );
}

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <BluetoothProvider>
          <AppContent />
        </BluetoothProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
