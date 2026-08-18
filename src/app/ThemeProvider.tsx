import React, {createContext, useContext, useMemo} from 'react';
import type {PropsWithChildren} from 'react';
import {useColorScheme} from 'react-native';
import {useAppState} from './AppStateProvider';
import {darkColors, lightColors} from './theme';
import type {AppColors} from './theme';

interface ThemeContextValue {
  isDark: boolean;
  resolved: 'light' | 'dark';
  colors: AppColors;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({children}: PropsWithChildren) {
  const system = useColorScheme();
  const {snapshot} = useAppState();
  const resolved =
    snapshot.preferences.theme === 'system'
      ? system === 'dark'
        ? 'dark'
        : 'light'
      : snapshot.preferences.theme;
  const value = useMemo<ThemeContextValue>(
    () => ({
      isDark: resolved === 'dark',
      resolved,
      colors: resolved === 'dark' ? darkColors : lightColors,
    }),
    [resolved],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useAppTheme must be used inside ThemeProvider.');
  return value;
}
