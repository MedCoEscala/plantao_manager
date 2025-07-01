const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname, {
  isCSSEnabled: true,
});

module.exports = withNativeWind(config, {
  input: './app/styles/global.css',
  inlineRem: 16,
});
