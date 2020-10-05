import path from "path"

export class ExampleFile {
  dir: string
  path: string
  number: string
  endpoint: string
  operation: string
  statusCode: string
  description: string
  isRequest: boolean
  isResponse: boolean

  constructor(filePath: string) {
    const pathObj = path.parse(filePath)
    const filename = pathObj.name
    const filenameSplit = filename.split("-").map(split => split.replace(/_/g, "-"))
    const directory = pathObj.dir

    this.dir = directory
    this.path = filePath

    this.number = filenameSplit[0]
    this.endpoint = filenameSplit[1].toLowerCase()
    this.operation = filenameSplit[3].toLowerCase()
    this.statusCode = filenameSplit[4] || filenameSplit[3]

    this.isRequest = filename.includes("Request")
    this.isResponse = filename.includes("Response")
  }
}
