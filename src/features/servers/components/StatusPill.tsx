import React from 'react';
import {ActivityIndicator, Text, View} from 'react-native';
import {useAppTheme} from '../../../app/ThemeProvider';
import type {ConnectionStatus} from '../types';

export function StatusPill({status}: {status: ConnectionStatus}) {
  const {colors} = useAppTheme();
  const tone =
    status === 'online'
      ? colors.positive
      : status === 'offline'
        ? colors.danger
        : colors.textTertiary;
  const label =
    status === 'online'
      ? 'Online'
      : status === 'offline'
        ? 'Offline'
        : status === 'checking'
          ? 'Checking'
          : 'Unknown';
  return (
    <View
      className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1"
      style={{backgroundColor: colors.backgroundSubtle}}>
      {status === 'checking' ? (
        <ActivityIndicator size={10} color={colors.textTertiary} />
      ) : (
        <View
          className="h-2 w-2 rounded-full"
          style={{backgroundColor: tone}}
        />
      )}
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 11.5,
          fontWeight: '600',
        }}>
        {label}
      </Text>
    </View>
  );
}
