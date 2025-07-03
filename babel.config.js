module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@': './app',
          },
        },
      ],
      ...(process.env.NODE_ENV !== 'production' ? ['nativewind/babel'] : []),
    ],
  };
};
