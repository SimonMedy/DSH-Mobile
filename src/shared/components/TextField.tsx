import React from 'react';
import {Text, TextInput, View} from 'react-native';
import type {TextInputProps} from 'react-native';
import {useAppTheme} from '../../app/ThemeProvider';

export function TextField({
  label,
  hint,
  error,
  ...props
}: TextInputProps & {label: string; hint?: string; error?: string}) {
  const {colors} = useAppTheme();
  return (
    <View className="gap-2">
      <Text style={{color: colors.text, fontSize: 14, fontWeight: '600'}}>
        {label}
      </Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.brand}
        className="rounded-xl px-4 py-3.5"
        style={{
          color: colors.text,
          backgroundColor: colors.surfaceRaised,
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.border,
          fontSize: 16,
        }}
      />
      {error ? (
        <Text style={{color: colors.danger, fontSize: 12.5}}>{error}</Text>
      ) : hint ? (
        <Text
          style={{color: colors.textTertiary, fontSize: 12.5, lineHeight: 18}}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
