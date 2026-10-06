const expoPackagePath = require.resolve('expo/package.json');
const expoPresetPath = require.resolve('babel-preset-expo', {
  paths: [expoPackagePath],
});

module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.integration.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'babel-jest',
      {
        configFile: false,
        babelrc: false,
        caller: { name: 'babel-jest', isServer: true },
        presets: [expoPresetPath],
      },
    ],
  },
};
