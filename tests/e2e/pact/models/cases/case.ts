import * as fhir from "../fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import * as fs from "fs"

export class Case {
  description: string
  request: fhir.Bundle
  statusText: string
  statusCode: number
  isSuccess: boolean

  constructor(description: string, requestFile: string, statusText: string) {
    const requestString = fs.readFileSync(requestFile, "utf-8")

    const requestJson = LosslessJson.parse(requestString)

    this.description = description
    this.request = requestJson
    this.statusText = statusText
    this.isSuccess = statusText === "200-OK"
    this.statusCode = parseInt(statusText.split("-")[0])
  }
}