import {Case} from "./case"
import {exampleFiles} from "../../services/example-files-fetcher"
import fs from "fs"
import * as XmlJs from "xml-js"
import {ExampleFile} from "../files/example-file"
import {Parameters} from "../../../../../coordinator/src/models/fhir/parameters"
import {Bundle} from "../../../../../coordinator/src/models/fhir/bundle"

export class ProcessCase extends Case {
  request: Bundle
  prepareResponse : Parameters
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

  toJestCase(): [string, Bundle, Parameters, string | XmlJs.ElementCompact, number] {
    return [this.description, this.request, this.prepareResponse, this.convertResponse, this.statusCode]
  }
}
