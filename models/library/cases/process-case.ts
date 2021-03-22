import {Case} from "./case"
import {exampleFiles} from "../fetchers/example-files-fetcher"
import fs from "fs"
import {ExampleFile} from "../files/example-file"
import * as fhir from "../fhir"
import * as LosslessJson from "lossless-json"

export class ProcessCase extends Case {
  request: fhir.Bundle
  prepareRequest: fhir.Bundle

  constructor(requestFile: ExampleFile, responseFile: ExampleFile) {
    super(requestFile, responseFile)

    const prepareRequest = exampleFiles.find(exampleFile =>
      exampleFile.dir === requestFile.dir
      && exampleFile.number === requestFile.number
      && exampleFile.endpoint === "prepare"
      && exampleFile.isRequest)

    this.prepareRequest = LosslessJson.parse(fs.readFileSync(prepareRequest.path, "utf-8"))
  }

  toJestCase(): [string, fhir.Bundle] {
    return [this.description, this.request]
  }
}
