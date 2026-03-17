/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // This tells Jest to map local .js imports to their actual .ts files
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};