module.exports = {
  preset: '@react-native/jest-preset',
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  // NativeWind JSX is handled by Metro in production, not by unit-test Jest.
  moduleNameMapper: {
    '^react-native-css-interop/jsx-runtime$': 'react/jsx-runtime',
  },
};
