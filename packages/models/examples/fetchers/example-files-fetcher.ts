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

const getExamplesFromDirectory = (examplesSubDirectory: string): Array<string> => {
  const examplesRootPath = "../../../../examples"
  return walk(path.join(__dirname, examplesRootPath, examplesSubDirectory))
}

const primaryCareFilePaths: Array<string> = getExamplesFromDirectory("primary-care")
const secondaryCareFilePaths: Array<string> = getExamplesFromDirectory("secondary-care")
const errorFilePaths: Array<string> = getExamplesFromDirectory("errors")

const allExampleFilePaths = [...primaryCareFilePaths, ...secondaryCareFilePaths, ...errorFilePaths]
export const exampleFiles: Array<ExampleFile> = allExampleFilePaths.map(examplePath => new ExampleFile(examplePath))
