module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ["./jest/setEnvVars.js"],
  moduleNameMapper: {
    "@models": `<rootDir>../models`,
    "@coordinator": `<rootDir>../coordinator`
  }
}
