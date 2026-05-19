/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/db/migrations/**',
  ],
  coverageDirectory: 'coverage',
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
    {
      displayName: 'e2e',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/test/e2e/**/*.e2e-spec.ts'],
      globalSetup: '<rootDir>/test/globalSetup.ts',
      globalTeardown: '<rootDir>/test/globalTeardown.ts',
      setupFiles: ['<rootDir>/test/setup.ts'],
      testTimeout: 60_000,
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
  ],
};
