module.exports = {
  // ─── Environment ──────────────────────────────────────────────
  testEnvironment: 'node',

  // Automatically clear mock calls, instances, contexts and results between tests
  clearMocks: true,
  restoreMocks: true,

  // ─── Coverage Collection ──────────────────────────────────────
  collectCoverage: true,

  // Use V8 coverage provider for better accuracy with async/await and wrappers
  coverageProvider: 'v8',

  collectCoverageFrom: [
    'src/**/*.js',

    // Exclude entry points & dev-only files
    '!src/server.js',
    // DO NOT exclude app.js - it's needed for route registration coverage

    // Exclude config / docs / scripts / seed data
    '!src/config/swagger.js',
    '!src/config/logger.js',
    '!src/docs/**',
    '!src/scripts/**',

    // Exclude test utilities
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
  ],

  // ─── Coverage Output ─────────────────────────────────────────
  coverageDirectory: 'coverage',

  coverageReporters: [
    'text',          // inline table in terminal
    'text-summary',  // compact summary in terminal
    'lcov',          // lcov.info + HTML (for CI tools & Codecov/Coveralls)
    'html',          // standalone HTML report
    'json-summary',  // machine-readable summary JSON
  ],

  // ─── Coverage Thresholds ─────────────────────────────────────
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 70,
      lines: 80,
      statements: 80,
    },
  },

  // ─── Test Discovery ──────────────────────────────────────────
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
  ],

  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/logs/',
    '/k6/',
  ],

  // ─── Module Resolution ───────────────────────────────────────
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)',
  ],

  // ─── Execution ────────────────────────────────────────────────
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  maxWorkers: '50%',
};
