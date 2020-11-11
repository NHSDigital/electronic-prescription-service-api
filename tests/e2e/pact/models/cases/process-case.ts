import * as fhir from "../fhir/fhir-resources"
import {Case} from "./case"
import {exampleFiles} from "../../services/example-files-fetcher"
import fs from "fs"

export class ProcessCase extends Case {
  description: string
  request: fhir.Bundle
  prepareResponse : fhir.Parameters

  constructor(description: string, requestFile: string) {
    super(description, requestFile)

    const processRequest = exampleFiles.find(exampleFile => exampleFile.path === requestFile)

    const prepareResponse = exampleFiles.find(exampleFile => 
      exampleFile.dir === processRequest.dir
      && exampleFile.number === processRequest.number
      && exampleFile.endpoint === "prepare"
      && exampleFile.isResponse)

    this.prepareResponse = JSON.parse(fs.readFileSync(prepareResponse.path, "utf-8"))
  }
}