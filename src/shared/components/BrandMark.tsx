import React from 'react';
import {Text, View} from 'react-native';
import {useAppTheme} from '../../app/ThemeProvider';

export function BrandMark({size = 38}: {size?: number}) {
  const {colors} = useAppTheme();
  return (
    <View
      className="items-center justify-center rounded-xl"
      style={{width: size, height: size, backgroundColor: colors.brand}}>
      <Text
        style={{
          color: '#FFFFFF',
          fontSize: size * 0.31,
          fontWeight: '800',
          letterSpacing: -0.4,
        }}>
        DSH
      </Text>
    </View>
  );
}
