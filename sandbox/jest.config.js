// jest.config.js
const {defaults} = require('jest-config');
module.exports = {
  // ...
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts', 'tsx'],
  // ...
};

// module.exports = {
//   rootDir: './',
//   roots: ['./'],
//   /*transform: {
//     '^.+\\.tsx?$': 'ts-jest',
//   },*/
//   testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.js?$',
//   moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
//   coveragePathIgnorePatterns: ["/node_modules/", "/tests/"]
// }