module.exports = {
  roots: ["./tests"],
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  coveragePathIgnorePatterns: ["/node_modules/", "/tests/"],
  setupFiles: ["./jest/setEnvVars.js"],
  setupFilesAfterEnv: ["jest-expect-message"],
  moduleNameMapper: {
    "@models": "<rootDir>../models"
  }
}
