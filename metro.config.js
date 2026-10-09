const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const configuration = getDefaultConfig(__dirname);

module.exports = withNativeWind(configuration, {
  input: './src/theme/global.css',
  inlineRem: 16,
});
