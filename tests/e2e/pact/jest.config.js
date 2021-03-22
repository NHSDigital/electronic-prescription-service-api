const fs = require("fs")
const path = require("path")

const pipelineModelsPath = "./models/library"
const isRunningInPipeline = fs.existsSync(path.join(__dirname, pipelineModelsPath))

const modelsPath = isRunningInPipeline ? pipelineModelsPath : "../../../models/library"
const coordinatorPath = isRunningInPipeline ? "./coordinator" : "../../../coordinator" 

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    "@models": `<rootDir>${modelsPath}`,
    "@coordinator": `<rootDir>${coordinatorPath}`
  }
}