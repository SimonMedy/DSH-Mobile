import './src/styles/global.css';

import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppStateProvider} from './src/app/AppStateProvider';
import {ThemeProvider, useAppTheme} from './src/app/ThemeProvider';
import {RootNavigator} from './src/navigation/RootNavigator';

function AppContent() {
  const {isDark, colors} = useAppTheme();

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
