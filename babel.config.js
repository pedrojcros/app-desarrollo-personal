module.exports = function (babelApi) {
  babelApi.cache(true);
  const expoPackagePath = require.resolve('expo/package.json');
  const expoPresetPath = require.resolve('babel-preset-expo', {
    paths: [expoPackagePath],
  });
  return {
    presets: [
      [expoPresetPath, { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
