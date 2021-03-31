import * as LosslessJson from "lossless-json"
import * as fs from "fs"
import {Case} from "./case"
import {ExampleFile} from "../example-file"
import * as fhir from "../../fhir"

export class PrepareCase extends Case {
  response: fhir.Parameters
  statusText: string

  constructor(requestFile: ExampleFile, responseFile: ExampleFile) {
    super(requestFile, responseFile)
    const responseString = fs.readFileSync(responseFile.path, "utf-8")
    const responseJson = LosslessJson.parse(responseString)
    this.response = responseJson
  }

  toJestCase(): [string, fhir.Bundle | fhir.Parameters, fhir.Parameters, number] {
    return [this.description, this.request, this.response, this.statusCode]
  }
}
