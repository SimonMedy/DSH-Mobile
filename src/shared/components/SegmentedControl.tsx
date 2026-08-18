import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {useAppTheme} from '../../app/ThemeProvider';

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: ReadonlyArray<{value: T; label: string}>;
  onChange: (value: T) => void;
}) {
  const {colors} = useAppTheme();
  return (
    <View
      className="flex-row rounded-xl p-1"
      style={{
        backgroundColor: colors.backgroundSubtle,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
      {options.map(option => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{selected}}
            onPress={() => onChange(option.value)}
            className="flex-1 items-center rounded-lg px-2 py-2.5"
            style={({pressed}) => ({
              backgroundColor: selected
                ? colors.surface
                : pressed
                  ? colors.surfacePressed
                  : 'transparent',
            })}>
            <Text
              style={{
                color: selected ? colors.text : colors.textSecondary,
                fontSize: 13.5,
                fontWeight: selected ? '700' : '600',
              }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
