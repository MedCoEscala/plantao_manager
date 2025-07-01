const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Configuração específica para Expo SDK 53 + NativeWind v4.0.1
config.resolver.sourceExts.push('css');

module.exports = withNativeWind(config, {
  input: './app/styles/global.css',
  configPath: './tailwind.config.js',
});
