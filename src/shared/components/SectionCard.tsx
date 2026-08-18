import React from 'react';
import type {PropsWithChildren} from 'react';
import {Text, View} from 'react-native';
import {useAppTheme} from '../../app/ThemeProvider';

export function SectionCard({
  title,
  description,
  children,
}: PropsWithChildren<{title?: string; description?: string}>) {
  const {colors} = useAppTheme();
  return (
    <View className="gap-3">
      {title ? (
        <Text style={{color: colors.text, fontSize: 15, fontWeight: '700'}}>
          {title}
        </Text>
      ) : null}
      {description ? (
        <Text
          style={{color: colors.textSecondary, fontSize: 13, lineHeight: 19}}>
          {description}
        </Text>
      ) : null}
      <View
        className="rounded-2xl p-4"
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
        {children}
      </View>
    </View>
  );
}
