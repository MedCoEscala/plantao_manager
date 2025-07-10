const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Configurações específicas para produção
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Garantir que CSS seja processado corretamente em produção
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Configurações específicas para NativeWind em produção
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// Configurar assets para incluir CSS
config.resolver.assetExts.push('css');

module.exports = withNativeWind(config, { 
  input: './global.css',
  configPath: './tailwind.config.js',
  inlineRem: 14
});