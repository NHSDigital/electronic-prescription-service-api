import * as fhir from "../fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import * as fs from "fs"
import {Case} from "./case"
import {ExampleFile} from "../files/example-file"

export class PrepareCase extends Case {
  response: fhir.Parameters
  statusText: string

  constructor(requestFile: ExampleFile, responseFile: ExampleFile) {
    super(requestFile, responseFile)
    const responseString = fs.readFileSync(responseFile.path, "utf-8")
    const responseJson = LosslessJson.parse(responseString)
    this.response = responseJson
  }
}
