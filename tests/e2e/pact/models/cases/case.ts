import * as fhir from "../fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import * as fs from "fs"

export class Case {
  description: string
  request: fhir.Bundle
  statusCode: string

  constructor(description: string, requestFile: string, statusCode: string) {
    const requestString = fs.readFileSync(requestFile, "utf-8")

    const requestJson = LosslessJson.parse(requestString)

    this.description = description
    this.request = requestJson
    this.statusCode = statusCode
  }
}