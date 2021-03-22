const fs = require("fs")
const path = require("path")

const localPath = "../../../models/library"
const pipelinePath = "./models/library"

const isRunningInPipeline = fs.existsSync(path.join(__dirname, pipelinePath))
const modelsPath = isRunningInPipeline ? pipelinePath : localPath

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    "@models": `<rootDir>${modelsPath}`
  }
}