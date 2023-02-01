import * as LosslessJson from "lossless-json"
import * as fs from "fs"
import {ExampleFile} from "../example-file"
import * as fhir from "../../fhir"
import path from "path"

export class Case {
  requestFile: ExampleFile
  responseFile?: ExampleFile

  description: string
  request: fhir.Resource
  statusText: string
  statusCode: number
  isSuccess: boolean

  constructor(requestFile: ExampleFile, responseFile: ExampleFile) {
    const requestString = fs.readFileSync(requestFile.path, "utf-8")
    const requestJson = LosslessJson.parse(requestString) as fhir.Resource

    this.requestFile = requestFile
    this.responseFile = responseFile

    //TODO - Reduce the amount of data we duplicate from the file.
    //Use functions instead of fields. Delegate to the file object instead
    this.description = createExampleDescription(requestFile)
    this.request = requestJson
    this.statusText = requestFile.statusText
    this.isSuccess = requestFile.statusText === "200-OK"
    this.statusCode = parseInt(requestFile.statusText.split("-")[0])
  }

  rewriteResponseFile(fileBody: string): void {
    fs.writeFileSync(this.responseFile.path, fileBody + "\n", "utf-8")
  }
}

const examplesRootPath = "../../../../examples"
function createExampleDescription(exampleFile: ExampleFile): string {
  return path.parse(path.relative(path.join(__dirname, examplesRootPath), exampleFile.path))
    .dir
    .replace(/\//g, " ")
    .replace(/\\/g, " ")
    + " "
    + `${exampleFile.number} ${exampleFile.statusText}${exampleFile.operation ? " " + exampleFile.operation : ""}`
}
