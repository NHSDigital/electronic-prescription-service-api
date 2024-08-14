// eslint-disable-next-line no-undef
module.exports = {
  roots: ["./tests"],
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  testEnvironment: "node",
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  coveragePathIgnorePatterns: ["/node_modules/", "/tests/"],
  setupFiles: ["./jest/setEnvVars.js"],
  setupFilesAfterEnv: [
    "./tests/jest.setup.ts",
    "jest-expect-message"
  ],
  moduleNameMapper: {
    "@models": "<rootDir>../models",
    
    // lossless-json is now published with both ESM and CommonJS exports.
    // Because Jest runs code in Node, we have to force it to
    // use the CommonJS import.
    // Source (actually from axios, not lossless-json):
    // https://github.com/axios/axios/issues/5101#issuecomment-1276572468
    // eslint-disable-next-line no-undef
    "^lossless-json$": require.resolve("lossless-json")
  },

  // Fix for: "Emitted 'error' event on ChildProcess instance at"
  // https://github.com/facebook/jest/issues/10144
  // https://jestjs.io/docs/cli#--maxworkersnumstring
  maxWorkers: 2,
}
