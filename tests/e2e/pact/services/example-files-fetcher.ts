import fs from "fs"
import path from "path"
import { ExampleFile as ExampleFile } from "../models/files/example-file"

const walk = function(dir) {
  let results = []
  const list = fs.readdirSync(dir)
  list.forEach(function(file) {
      file = dir + '/' + file
      const stat = fs.statSync(file)
      if (stat && stat.isDirectory()) { 
          results = results.concat(walk(file))
      } else {
          if (file.endsWith(".json") || file.endsWith(".xml")) {
              results.push(file)
          }
      }
  })
  return results
}

const allExampleFilePaths: Array<string> = walk(path.join(__dirname, "../resources/parent-prescription"))
export const exampleFiles: ExampleFile[] = allExampleFilePaths.map(examplePath => new ExampleFile(examplePath)) 