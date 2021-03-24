import {Case} from "./case"
import {exampleFiles} from "../fetchers/example-files-fetcher"
import fs from "fs"
import {ExampleFile} from "../files/example-file"
import * as fhir from "../fhir"
import * as LosslessJson from "lossless-json"

export class ProcessCase extends Case {
  request: fhir.Bundle
  prepareRequest?: fhir.Bundle
  prepareRequestFile?: ExampleFile
  prepareResponseFile?: ExampleFile
  convertResponseFile?: ExampleFile

  constructor(requestFile: ExampleFile, responseFile: ExampleFile) {
    super(requestFile, responseFile)

    const prepareRequestFile = exampleFiles.find(exampleFile =>
      exampleFile.dir === requestFile.dir
      && exampleFile.number === requestFile.number
      && exampleFile.endpoint === "prepare"
      && exampleFile.statusText === requestFile.statusText
      && exampleFile.isRequest)
    this.prepareRequestFile = prepareRequestFile
    if (prepareRequestFile) {
      this.prepareRequest = LosslessJson.parse(fs.readFileSync(prepareRequestFile.path, "utf-8"))
    }

    const prepareResponseFile = exampleFiles.find(exampleFile =>
      exampleFile.dir === requestFile.dir
      && exampleFile.number === requestFile.number
      && exampleFile.endpoint === "prepare"
      && exampleFile.statusText === requestFile.statusText
      && exampleFile.isResponse)
      
    this.prepareResponseFile = prepareResponseFile

    const convertResponseFile = exampleFiles.find(exampleFile =>
      exampleFile.dir === requestFile.dir
      && exampleFile.number === requestFile.number
      && exampleFile.endpoint === "convert"
      && exampleFile.operation == requestFile.operation
      && exampleFile.isResponse
      && exampleFile.statusText === requestFile.statusText)
    this.convertResponseFile = convertResponseFile
  }

  toJestCase(): [string, fhir.Bundle] {
    return [this.description, this.request]
  }
}
