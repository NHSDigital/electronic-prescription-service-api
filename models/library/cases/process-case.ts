import {Case} from "./case"
import {exampleFiles} from "../fetchers/example-files-fetcher"
import fs from "fs"
import * as XmlJs from "xml-js"
import {ExampleFile} from "../files/example-file"
import * as fhir from "../fhir"

export class ProcessCase extends Case {
  request: fhir.Bundle
  prepareResponse : fhir.Parameters
  convertResponse: XmlJs.ElementCompact | string

  constructor(requestFile: ExampleFile, responseFile: ExampleFile) {
    super(requestFile, responseFile)

    const prepareResponse = exampleFiles.find(exampleFile =>
      exampleFile.dir === requestFile.dir
      && exampleFile.number === requestFile.number
      && exampleFile.endpoint === "prepare"
      && exampleFile.isResponse)

    this.prepareResponse = JSON.parse(fs.readFileSync(prepareResponse.path, "utf-8"))

    const convertResponse = exampleFiles.find(exampleFile =>
      exampleFile.dir === requestFile.dir
      && exampleFile.number === requestFile.number
      && exampleFile.endpoint === "convert"
      && exampleFile.isResponse)

    const convertResponseStr = fs.readFileSync(convertResponse.path, "utf-8")
    this.convertResponse = requestFile.statusText === "200-OK" ? XmlJs.xml2js(convertResponseStr, {compact: true}) : convertResponseStr
  }

  toJestCase(): [string, fhir.Bundle, fhir.Parameters, string | XmlJs.ElementCompact, number] {
    return [this.description, this.request, this.prepareResponse, this.convertResponse, this.statusCode]
  }
}
