import fs from "fs"
import path from "path"

const walk = function(dir) {
  let results = []
  const list = fs.readdirSync(dir)
  list.forEach(function(file) {
      file = dir + '/' + file
      const stat = fs.statSync(file)
      if (stat && stat.isDirectory()) { 
          results = results.concat(walk(file))
      } else { 
          results.push(file)
      }
  })
  return results
}

export const rootPath = "../resources/parent-prescription"

export const allExamplePaths: Array<string> = walk(path.join(__dirname, rootPath))