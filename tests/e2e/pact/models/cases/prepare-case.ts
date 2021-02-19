import * as LosslessJson from "lossless-json"
import * as fs from "fs"
import {Case} from "./case"
import {ExampleFile} from "../files/example-file"
import {Parameters} from "../../../../../coordinator/src/models/fhir/parameters"

export class PrepareCase extends Case {
  response: Parameters
  statusText: string

  constructor(requestFile: ExampleFile, responseFile: ExampleFile) {
    super(requestFile, responseFile)
    const responseString = fs.readFileSync(responseFile.path, "utf-8")
    const responseJson = LosslessJson.parse(responseString)
    this.response = responseJson
  }
}
