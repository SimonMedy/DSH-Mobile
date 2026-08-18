module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    'no-console': ['warn', {allow: ['warn', 'error']}],
    'react-native/no-inline-styles': 'off',
    'no-void': 'off',
  },
  overrides: [
    {
      files: ['__tests__/**/*'],
      rules: {
        'no-script-url': 'off',
      },
    },
  ],
};
