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
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.tsx'],
  testPathIgnorePatterns: ['/node_modules/', '\\.integration\\.test\\.'],
  transformIgnorePatterns,
};
