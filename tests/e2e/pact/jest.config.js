const fs = require("fs")
const path = require("path")

const pipelineModelsPath = "./models"
const isRunningInPipeline = fs.existsSync(path.join(__dirname, pipelineModelsPath))

const modelsPath = isRunningInPipeline ? pipelineModelsPath : "../../../models"
const coordinatorPath = isRunningInPipeline ? "./coordinator" : "../../../coordinator" 

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ["./jest/setEnvVars.js"],
  moduleNameMapper: {
    "@models": `<rootDir>${modelsPath}`,
    "@coordinator": `<rootDir>${coordinatorPath}`
  }
}