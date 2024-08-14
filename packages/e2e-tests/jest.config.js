/* eslint-disable no-undef */
const fs = require("fs")
const path = require("path")

const pipelineModelsPath = "./models"
const isRunningInPipeline = fs.existsSync(path.join(__dirname, pipelineModelsPath))

const modelsPath = isRunningInPipeline ? pipelineModelsPath : "../models"
const coordinatorPath = isRunningInPipeline ? "./coordinator" : "../coordinator" 

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ["./jest/setEnvVars.js"],
  moduleNameMapper: {
    "@models": `<rootDir>${modelsPath}`,
    "@coordinator": `<rootDir>${coordinatorPath}`,

    // lossless-json is now published with both ESM and CommonJS exports.
    // Because Jest runs code in Node, we have to force it to
    // use the CommonJS import.
    // Source (actually from axios, not lossless-json):
    // https://github.com/axios/axios/issues/5101#issuecomment-1276572468
    "^lossless-json$": require.resolve("lossless-json")
  }
}
