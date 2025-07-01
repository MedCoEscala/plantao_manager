module.exports = function (api) {
  api.cache(true);

  // Configuração específica para Expo SDK 53 + NativeWind v4
  const isProduction = process.env.NODE_ENV === 'production';
  const isDev = process.env.NODE_ENV === 'development' || !isProduction;

  return {
    presets: ['babel-preset-expo'],
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
      // NativeWind v2: funciona perfeitamente em dev e produção
      'nativewind/babel',
      // Console removal apenas em produção
      ...(isProduction ? [['transform-remove-console', { exclude: ['error', 'warn'] }]] : []),
    ],
  };
};
