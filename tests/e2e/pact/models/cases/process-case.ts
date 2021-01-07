import * as fhir from "../fhir/fhir-resources"
import {Case} from "./case"
import {exampleFiles} from "../../services/example-files-fetcher"
import fs from "fs"
import * as XmlJs from "xml-js"

export class ProcessCase extends Case {
  description: string
  request: fhir.Bundle
  prepareResponse : fhir.Parameters
  convertResponse: XmlJs.ElementCompact | string

  constructor(description: string, requestFile: string, statusText: string) {
    super(description, requestFile, statusText)

    const processRequest = exampleFiles.find(exampleFile => exampleFile.path === requestFile)

    const prepareResponse = exampleFiles.find(exampleFile => 
      exampleFile.dir === processRequest.dir
      && exampleFile.number === processRequest.number
      && exampleFile.endpoint === "prepare"
      && exampleFile.isResponse)

    this.prepareResponse = JSON.parse(fs.readFileSync(prepareResponse.path, "utf-8"))

    const convertResponse = exampleFiles.find(exampleFile => 
      exampleFile.dir === processRequest.dir
      && exampleFile.number === processRequest.number
      && exampleFile.endpoint === "convert"
      && exampleFile.isResponse)

    const convertResponseStr = fs.readFileSync(convertResponse.path, "utf-8")
    this.convertResponse = statusText === "200-OK" ? XmlJs.xml2js(convertResponseStr, {compact: true}) : convertResponseStr
  }
}