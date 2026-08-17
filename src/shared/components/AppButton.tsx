import React from 'react';
import type {ReactNode} from 'react';
import {ActivityIndicator, Pressable, Text, View} from 'react-native';
import {useAppTheme} from '../../app/ThemeProvider';

export type ButtonTone = 'primary' | 'secondary' | 'danger' | 'ghost';

export function AppButton({
  label,
  onPress,
  tone = 'primary',
  disabled = false,
  loading = false,
  icon,
  compact = false,
}: {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  compact?: boolean;
}) {
  const {colors} = useAppTheme();
  const background =
    tone === 'primary'
      ? colors.brand
      : tone === 'danger'
        ? colors.danger
        : tone === 'secondary'
          ? colors.surfaceRaised
          : 'transparent';
  const foreground =
    tone === 'primary' || tone === 'danger' ? '#FFFFFF' : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      className={`flex-row items-center justify-center rounded-xl ${compact ? 'px-3 py-2.5' : 'px-4 py-3.5'}`}
      style={({pressed}) => ({
        backgroundColor: background,
        borderWidth: tone === 'secondary' ? 1 : 0,
        borderColor: colors.border,
        opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
      })}>
      {loading ? (
        <ActivityIndicator size="small" color={foreground} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text style={{color: foreground, fontSize: 15, fontWeight: '700'}}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
