import React, {useCallback, useRef} from 'react';
import {ActivityIndicator, Text, View} from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAppState} from '../app/AppStateProvider';
import {useAppTheme} from '../app/ThemeProvider';
import {DshBrowserScreen} from '../features/browser/screens/DshBrowserScreen';
import {ServerEditorScreen} from '../features/servers/screens/ServerEditorScreen';
import {ServerListScreen} from '../features/servers/screens/ServerListScreen';
import {SettingsScreen} from '../features/settings/screens/SettingsScreen';
import type {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function RootNavigator() {
  const {snapshot, hydrated} = useAppState();
  const {colors, isDark} = useAppTheme();
  const launchHandled = useRef(false);

  const handleReady = useCallback(() => {
    if (launchHandled.current) return;
    launchHandled.current = true;
    if (snapshot.preferences.launch !== 'default') return;
    const server = snapshot.servers.find(item => item.isDefault);
    if (server && navigationRef.isReady()) {
      navigationRef.navigate('Browser', {serverId: server.id});
    }
  }, [snapshot.preferences.launch, snapshot.servers]);

  if (!hydrated) {
    return (
      <View
        className="flex-1 items-center justify-center gap-4"
        style={{backgroundColor: colors.background}}>
        <ActivityIndicator size="large" color={colors.brand} />
        <Text style={{color: colors.textSecondary, fontSize: 13.5}}>
          Loading your servers…
        </Text>
      </View>
    );
  }

  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.brand,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      onReady={handleReady}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: {backgroundColor: colors.background},
        }}>
        <Stack.Screen name="Servers" component={ServerListScreen} />
        <Stack.Screen name="ServerEditor" component={ServerEditorScreen} />
        <Stack.Screen
          name="Browser"
          component={DshBrowserScreen}
          options={{animation: 'fade'}}
        />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
