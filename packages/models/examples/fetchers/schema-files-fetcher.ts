import fs from "fs"
import path from "path"

function walk(dir: string) {
  const results = Array<string>()
  try {
    const list = fs.readdirSync(dir)
    list.forEach(function(file) {
      file = dir + "/" + file
      const stat = fs.statSync(file)
      if (stat && stat.isFile()) {
        results.push(file)
      }
    })
    return results
  } catch {
    return []
  }
}

const getSchemaFromDirectory = (): Array<string> => {
  const schemaRootPath = "../../../../packages/coordinator/tests/services/translation/schema"
  return walk(path.join(__dirname, schemaRootPath))
}

export const schemaFilePaths: Array<string> = getSchemaFromDirectory()
