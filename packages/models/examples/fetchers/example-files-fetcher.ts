import fs from "fs"
import path from "path"
import {ExampleFile} from "../example-file"

function walk(dir: string) {
  let results = Array<string>()
  try {
    const list = fs.readdirSync(dir)
    list.forEach(function(file) {
      file = dir + "/" + file
      const stat = fs.statSync(file)
      if (stat && stat.isDirectory()) {
        results = results.concat(walk(file))
      } else {
        const fileExt = path.parse(file).ext
        if (fileExt.includes("json") || fileExt.includes("xml")) {
          results.push(file)
        }
      }
    })
    return results
  } catch {
    return []
  }
}

const getExamplesDirectory = (examplesSubDirectory: string): string[] => {
  const isRunningOnAzureCI = process.env.TF_BUILD
  console.log("Checking whether we are currently on a CI build - TF_BUILD:", isRunningOnAzureCI)
  // The directories 'models' and 'examples' are on the same level on CI, so we need to adjust the path
  const examplesRootPath = isRunningOnAzureCI ? "../../../examples" : "../../../../examples"
  return walk(path.join(__dirname, examplesRootPath, examplesSubDirectory))
}

const primaryCareFilePaths: Array<string> = getExamplesDirectory("primary-care")
const secondaryCareFilePaths: Array<string> = getExamplesDirectory("secondary-care")
const errorFilePaths: Array<string> = getExamplesDirectory("errors")

const allExampleFilePaths = [...primaryCareFilePaths, ...secondaryCareFilePaths, ...errorFilePaths]
export const exampleFiles: Array<ExampleFile> = allExampleFilePaths.map(examplePath => new ExampleFile(examplePath))
