import fs from "fs"
import path from "path"
import {ExampleFile} from "../files/example-file"

const walk = function(dir: string) {
  let results = Array<string>()
  const list = fs.readdirSync(dir)
  list.forEach(function(file) {
      file = dir + '/' + file
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
}

const primaryCareFilePaths: Array<string> = walk(path.join(__dirname, "../../examples/primary-care"))
const secondaryCareFilePaths: Array<string> = walk(path.join(__dirname, "../../examples/secondary-care"))
const allExampleFilePaths = [...primaryCareFilePaths, ...secondaryCareFilePaths]
export const exampleFiles: ExampleFile[] = allExampleFilePaths.map(examplePath => new ExampleFile(examplePath))
