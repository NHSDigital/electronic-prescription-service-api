import * as fhir from "../fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import * as fs from "fs"
import {Case} from "./case"

export class PrepareCase extends Case {
  response: fhir.Parameters
  statusCode: string

  constructor(description: string, requestFile: string, responseFile: string, statusCode: string) {
    super(description, requestFile)
    const responseString = fs.readFileSync(responseFile, "utf-8")
    const responseJson = LosslessJson.parse(responseString)
    this.response = responseJson
    this.statusCode = statusCode
  }
}