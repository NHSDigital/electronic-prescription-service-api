import {Case} from "./case"
import {exampleFiles} from "../fetchers"
import fs from "fs"
import {ExampleFile} from "../example-file"
import * as fhir from "../../fhir"
import * as LosslessJson from "lossless-json"

export class ProcessCase extends Case {
  request: fhir.Bundle
  response?: fhir.OperationOutcome
  prepareRequest?: fhir.Bundle
  prepareRequestFile?: ExampleFile
  prepareResponseFile?: ExampleFile
  convertResponseFile?: ExampleFile

  constructor(requestFile: ExampleFile, responseFile?: ExampleFile) {
    super(requestFile, responseFile)

    if (responseFile) {
      this.response = LosslessJson.parse(fs.readFileSync(responseFile.path, "utf-8")) as fhir.OperationOutcome
    }

    const prepareRequestFile = exampleFiles.find(exampleFile =>
      exampleFile.dir === requestFile.dir
      && exampleFile.number === requestFile.number
      && exampleFile.endpoint === "prepare"
      && exampleFile.statusText === requestFile.statusText
      && exampleFile.isRequest)
    this.prepareRequestFile = prepareRequestFile

    if (prepareRequestFile) {
      this.prepareRequest = LosslessJson.parse(fs.readFileSync(prepareRequestFile.path, "utf-8")) as fhir.Bundle
    }

    this.prepareResponseFile = exampleFiles.find(exampleFile =>
      exampleFile.dir === requestFile.dir
      && exampleFile.number === requestFile.number
      && exampleFile.endpoint === "prepare"
      && exampleFile.statusText === requestFile.statusText
      && exampleFile.isResponse)

    this.convertResponseFile = exampleFiles.find(exampleFile =>
      exampleFile.dir === requestFile.dir
      && exampleFile.number === requestFile.number
      && exampleFile.endpoint === "convert"
      && exampleFile.operation === requestFile.operation
      && exampleFile.isResponse
      && exampleFile.statusText === requestFile.statusText)
  }

  toJestCase(): [string, fhir.Bundle] {
    return [this.description, this.request]
  }

  // [description, request, response, statusCode]
  toErrorJestCase(): [string, fhir.Bundle, fhir.OperationOutcome, number, string] {
    return [this.description, this.request, this.response, this.statusCode, this.statusText]
  }
}
