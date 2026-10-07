const { defineConfig } = require('eslint/config');
const expoConfiguration = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfiguration,
  {
    ignores: [
      'dist/**',
      '.vercel/**',
      'coverage/**',
      '.expo/**',
      '.agents/**',
      '.claude/**',
    ],
  },
]);
