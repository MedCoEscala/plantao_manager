module.exports = function (api) {
  api.cache(true);

  // Configuração específica para Expo SDK 53 + NativeWind v4
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@app': './app',
            '@': './app',
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      ],
      // Plugin do NativeWind como plugin em vez de preset
      ['nativewind/babel'],
      // Console removal apenas em produção
      ...(isProduction ? [['transform-remove-console', { exclude: ['error', 'warn'] }]] : []),
    ],
  };
};
