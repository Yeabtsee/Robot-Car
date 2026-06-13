/**
 * ThemeContext — Simple theme management context.
 *
 * Provides dynamic monochrome palettes for both Dark and Light themes.
 */

import React, {createContext, useContext, useState, useEffect} from 'react';
import {useColorScheme} from 'react-native';

export interface ThemeColors {
  background: string;
  card: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  
  buttonBackground: string;
  buttonText: string;
  buttonBorder: string;
  
  buttonDefaultBg: string;
  buttonDefaultText: string;
  buttonDefaultBorder: string;
  
  buttonActiveBg: string;
  buttonActiveText: string;
  buttonActiveBorder: string;
  
  buttonDisabledBg: string;
  buttonDisabledText: string;
  buttonDisabledBorder: string;

  stopButtonBg: string;
  stopButtonText: string;
  stopButtonBorder: string;
  stopButtonPressedBg: string;
  
  toastBackground: string;
  toastBorder: string;
  toastText: string;
  
  badgeBorder: string;
  badgeDotEnabled: string;
  badgeDotDisabled: string;
  
  fanTrackOff: string;
  fanTrackOn: string;
  fanKnobOff: string;
  fanKnobOn: string;
  fanBorderOff: string;
  fanBorderOn: string;
  fanTextOn: string;
  fanTextOff: string;
}

export const darkThemeColors: ThemeColors = {
  background: '#000000',
  card: '#0A0A0A',
  border: '#222222',
  text: '#FFFFFF',
  textMuted: '#888888',
  primary: '#FFFFFF',
  primaryText: '#000000',
  
  buttonBackground: '#FFFFFF',
  buttonText: '#000000',
  buttonBorder: '#FFFFFF',
  
  buttonDefaultBg: '#FFFFFF',
  buttonDefaultText: '#000000',
  buttonDefaultBorder: '#FFFFFF',
  
  buttonActiveBg: '#FFFFFF',
  buttonActiveText: '#000000',
  buttonActiveBorder: '#FFFFFF',
  
  buttonDisabledBg: '#050505',
  buttonDisabledText: '#333333',
  buttonDisabledBorder: '#111111',

  stopButtonBg: '#FFFFFF',
  stopButtonText: '#000000',
  stopButtonBorder: '#FFFFFF',
  stopButtonPressedBg: '#E0E0E0',
  
  toastBackground: '#0A0A0A',
  toastBorder: '#FFFFFF',
  toastText: '#FFFFFF',
  
  badgeBorder: '#222222',
  badgeDotEnabled: '#FFFFFF',
  badgeDotDisabled: '#444444',
  
  fanTrackOff: '#111111',
  fanTrackOn: '#FFFFFF',
  fanKnobOff: '#555555',
  fanKnobOn: '#000000',
  fanBorderOff: '#222222',
  fanBorderOn: '#FFFFFF',
  fanTextOn: '#FFFFFF',
  fanTextOff: '#555555',
};

export const lightThemeColors: ThemeColors = {
  background: '#FFFFFF',
  card: '#F5F5F5',
  border: '#E0E0E0',
  text: '#000000',
  textMuted: '#666666',
  primary: '#000000',
  primaryText: '#FFFFFF',
  
  buttonBackground: '#000000',
  buttonText: '#FFFFFF',
  buttonBorder: '#000000',
  
  buttonDefaultBg: '#000000',
  buttonDefaultText: '#FFFFFF',
  buttonDefaultBorder: '#000000',
  
  buttonActiveBg: '#000000',
  buttonActiveText: '#FFFFFF',
  buttonActiveBorder: '#000000',
  
  buttonDisabledBg: '#FAFAFA',
  buttonDisabledText: '#CCCCCC',
  buttonDisabledBorder: '#E0E0E0',

  stopButtonBg: '#000000',
  stopButtonText: '#FFFFFF',
  stopButtonBorder: '#000000',
  stopButtonPressedBg: '#333333',
  
  toastBackground: '#FFFFFF',
  toastBorder: '#000000',
  toastText: '#000000',
  
  badgeBorder: '#E0E0E0',
  badgeDotEnabled: '#000000',
  badgeDotDisabled: '#CCCCCC',
  
  fanTrackOff: '#EEEEEE',
  fanTrackOn: '#000000',
  fanKnobOff: '#CCCCCC',
  fanKnobOn: '#FFFFFF',
  fanBorderOff: '#E0E0E0',
  fanBorderOn: '#000000',
  fanTextOn: '#000000',
  fanTextOff: '#888888',
};

export type ThemeType = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeType;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>('dark'); // Default to dark mode

  useEffect(() => {
    if (systemScheme) {
      setTheme(systemScheme);
    }
  }, [systemScheme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const colors = theme === 'dark' ? darkThemeColors : lightThemeColors;

  return (
    <ThemeContext.Provider value={{theme, colors, toggleTheme}}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
