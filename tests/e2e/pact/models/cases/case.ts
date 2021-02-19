import * as LosslessJson from "lossless-json"
import * as fs from "fs"
import {ExampleFile} from "../files/example-file"
import {createExampleDescription} from "../../resources/common"
import {Parameters} from "../../../../../coordinator/src/models/fhir/parameters"
import {Bundle} from "../../../../../coordinator/src/models/fhir/bundle"

export class Case {
  requestFile: ExampleFile
  responseFile?: ExampleFile

  description: string
  request: Bundle | Parameters
  statusText: string
  statusCode: number
  isSuccess: boolean

  constructor(requestFile: ExampleFile, responseFile: ExampleFile) {
    const requestString = fs.readFileSync(requestFile.path, "utf-8")
    const requestJson = LosslessJson.parse(requestString)

    this.requestFile = requestFile
    this.responseFile = responseFile

    //TODO - Reduce the amount of data we duplicate from the file. Use functions instead of fields. Delegate to the file object instead
    this.description = createExampleDescription(requestFile)
    this.request = requestJson
    this.statusText = requestFile.statusText
    this.isSuccess = requestFile.statusText === "200-OK"
    this.statusCode = parseInt(requestFile.statusText.split("-")[0])
  }
}
