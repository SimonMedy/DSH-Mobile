import React from 'react';
import {Image, View} from 'react-native';
import {useAppTheme} from '../../app/ThemeProvider';

const whaleWhite = require('../../assets/whale-white.png');
const whaleBlue = require('../../assets/whale-foreground.png');

export function BrandMark({size = 40}: {size?: number}) {
  const {colors, isDark} = useAppTheme();
  const imageSource = isDark ? whaleWhite : whaleBlue;
  const imageSize = size * 0.82;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: isDark
          ? 'rgba(255, 255, 255, 0.08)'
          : colors.brandSoft,
        borderWidth: 1,
        borderColor: isDark
          ? 'rgba(255, 255, 255, 0.14)'
          : 'rgba(77, 107, 254, 0.20)',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
      <Image
        source={imageSource}
        style={{width: imageSize, height: imageSize}}
        resizeMode="contain"
        accessibilityLabel="DSH Mobile Logo"
      />
    </View>
  );
}
