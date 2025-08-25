export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/js/$1',
    '^@core/(.*)$': '<rootDir>/js/core/$1',
    '^@systems/(.*)$': '<rootDir>/js/systems/$1',
    '^@rendering/(.*)$': '<rootDir>/js/rendering/$1',
    '^@ui/(.*)$': '<rootDir>/js/ui/$1',
    '^@data/(.*)$': '<rootDir>/js/data/$1',
    '^@utils/(.*)$': '<rootDir>/js/utils/$1'
  },
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/main.js',
    '!js/legacy/**',
    '!js/**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/js/**/*.test.js'
  ],
  globals: {
    G: {},
    canvas: {},
    ctx: {},
    ENABLE_ANALYTICS: true
  }
};