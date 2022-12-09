const fs = require("fs")
const path = require("path")

const modelsPath = "../models"
const coordinatorPath = "../coordinator" 

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ["./jest/setEnvVars.js"],
  moduleNameMapper: {
    "@models": `<rootDir>${modelsPath}`,
    "@coordinator": `<rootDir>${coordinatorPath}`
  }
}