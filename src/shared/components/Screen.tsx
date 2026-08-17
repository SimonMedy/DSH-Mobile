import React from 'react';
import type {PropsWithChildren} from 'react';
import {View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAppTheme} from '../../app/ThemeProvider';

export function Screen({children}: PropsWithChildren) {
  const {colors} = useAppTheme();
  return (
    <SafeAreaView
      edges={['top', 'right', 'bottom', 'left']}
      style={{flex: 1, backgroundColor: colors.background}}>
      <View className="flex-1" style={{backgroundColor: colors.background}}>
        {children}
      </View>
    </SafeAreaView>
  );
}
