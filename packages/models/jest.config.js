/* eslint-disable no-undef */
module.exports = {
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
  moduleFileExtensions: ["ts", "js"],
  coveragePathIgnorePatterns: ["/node_modules/", "/tests/"],
  moduleNameMapper: {
    // lossless-json is now published with both ESM and CommonJS exports.
    // Because Jest runs code in Node, we have to force it to
    // use the CommonJS import.
    // Source (actually from axios, not lossless-json):
    // https://github.com/axios/axios/issues/5101#issuecomment-1276572468
    "^lossless-json$": require.resolve("lossless-json")
  }
}
