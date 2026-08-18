import React from 'react';
import type {ReactNode} from 'react';
import {ActivityIndicator, Pressable, Text, View} from 'react-native';
import {useAppTheme} from '../../app/ThemeProvider';

export type ButtonTone =
  'primary' | 'secondary' | 'electric' | 'danger' | 'ghost';

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
  const {colors, isDark} = useAppTheme();

  const isPrimary = tone === 'primary';
  const isSecondary = tone === 'secondary';
  const isElectric = tone === 'electric';
  const isDanger = tone === 'danger';

  // DeepSeek Official Button Token Mapping
  let backgroundColor: string;
  let textColor: string;
  let borderColor = 'transparent';
  let borderWidth = 0;

  if (isPrimary) {
    if (isDark) {
      backgroundColor = '#FFFFFF';
      textColor = '#0A0A0A';
    } else {
      backgroundColor = colors.brand;
      textColor = '#FFFFFF';
    }
  } else if (isElectric) {
    backgroundColor = colors.brand;
    textColor = '#FFFFFF';
  } else if (isSecondary) {
    backgroundColor = isDark ? 'rgba(255, 255, 255, 0.06)' : colors.surface;
    textColor = colors.text;
    borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : colors.border;
    borderWidth = 1;
  } else if (isDanger) {
    backgroundColor = colors.dangerSoft;
    textColor = colors.danger;
  } else {
    // ghost
    backgroundColor = 'transparent';
    textColor = colors.textSecondary;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({pressed}) => ({
        width: '100%',
        alignSelf: 'stretch',
        opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
      })}>
      <View
        style={{
          width: '100%',
          backgroundColor,
          borderRadius: 100, // DeepSeek standard pill radius
          paddingVertical: compact ? 10 : 13,
          paddingHorizontal: compact ? 16 : 22,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth,
          borderColor,
        }}>
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}>
            {icon}
            <Text
              style={{
                color: textColor,
                fontSize: compact ? 14 : 15,
                fontWeight: '600',
                textAlign: 'center',
                letterSpacing: -0.2,
              }}>
              {label}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
