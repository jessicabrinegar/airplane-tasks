export default {
  bail: 1,
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  verbose: true,
  preset: 'ts-jest',
  transform: {
    '^.+.js$': 'babel-jest',
  },
}
