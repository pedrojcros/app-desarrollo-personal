const expoPreset = require('jest-expo/jest-preset');
const transformIgnorePatterns = expoPreset.transformIgnorePatterns.map(
  (pattern) =>
    pattern.replace(
      'standard-navigation',
      'standard-navigation|@rn-primitives',
    ),
);

module.exports = {
  preset: 'jest-expo',
  // lucide solo publica ESM para React Native, y Jest necesita su versión CJS.
  // AsyncStorage no tiene módulo nativo en Jest: se usa su simulación oficial.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^lucide-react-native$':
      '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock.js',
  },
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.tsx'],
  testPathIgnorePatterns: ['/node_modules/', '\\.integration\\.test\\.'],
  transformIgnorePatterns,
};
