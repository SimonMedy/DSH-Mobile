import React from 'react';
import type {ReactNode} from 'react';
import {Pressable} from 'react-native';
import {useAppTheme} from '../../app/ThemeProvider';

export function IconButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  const {colors} = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      className="h-10 w-10 items-center justify-center rounded-xl"
      style={({pressed}) => ({
        backgroundColor: pressed ? colors.surfacePressed : 'transparent',
      })}>
      {children}
    </Pressable>
  );
}
