import path from "path"

export class ExampleFile {
  dir: string
  path: string
  number: string
  endpoint: string
  operation?: string
  statusText: string
  description: string
  isRequest: boolean
  isResponse: boolean

  constructor(filePath: string) {
    const pathObj = path.parse(filePath)
    const filename = pathObj.name
    const filenameSplit = filename.split("-").map(split => split.replace(/_/g, "-"))
    this.dir = pathObj.dir
    this.path = filePath

    this.number = filenameSplit[0]
    this.endpoint = filenameSplit[1].toLowerCase()
    this.operation = filenameSplit[3].toLowerCase()
    this.statusText = filenameSplit[4] || filenameSplit[3]

    if (this.operation === this.statusText.toLowerCase()) {
      this.operation = undefined
    }

    this.isRequest = filenameSplit[2] === "Request"
    this.isResponse = filenameSplit[2] === "Response"
  }
}
