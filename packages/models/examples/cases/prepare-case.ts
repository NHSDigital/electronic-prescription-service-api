import * as LosslessJson from "lossless-json"
import * as fs from "fs"
import {Case} from "./case"
import {ExampleFile} from "../example-file"
import * as fhir from "../../fhir"

export class PrepareCase extends Case {
  request: fhir.Bundle
  response: fhir.Parameters
  statusText: string

  constructor(requestFile: ExampleFile, responseFile: ExampleFile) {
    super(requestFile, responseFile)
    const responseString = fs.readFileSync(responseFile.path, "utf-8")
    this.response = LosslessJson.parse(responseString) as fhir.Parameters
  }

  toJestCase(): [string, fhir.Bundle, fhir.Parameters, number] {
    return [this.description, this.request, this.response, this.statusCode]
  }
}
