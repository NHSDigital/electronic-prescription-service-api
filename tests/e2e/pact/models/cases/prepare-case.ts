import * as fhir from "../fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import * as fs from "fs"
import {Case} from "./case"

export class PrepareCase extends Case {
  response: fhir.Parameters
  statusText: string

  constructor(description: string, requestFile: string, responseFile: string, statusText: string) {
    super(description, requestFile, statusText)
    const responseString = fs.readFileSync(responseFile, "utf-8")
    const responseJson = LosslessJson.parse(responseString)
    this.response = responseJson
  }
}