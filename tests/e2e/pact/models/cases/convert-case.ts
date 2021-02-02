/* eslint-disable-next-line */
import * as fs from "fs"
import * as fhir from "../fhir/fhir-resources"
import {Case} from "./case"
import * as LosslessJson from "lossless-json"

export class ConvertCase extends Case {
  description: string
  request: fhir.Bundle
  response: string
  responseMatcher: string
  statusText: string

  constructor(description: string, requestFilePath: string, responseFilePath: string, statusText: string) {
    super(description, requestFilePath, statusText)

    const responseString = fs.readFileSync(responseFilePath, "utf-8")
    this.response = this.isSuccess ? responseString : JSON.parse(LosslessJson.stringify(responseString))
    this.responseMatcher =  this.isSuccess ? this.buildResponseMatcher(this.response).trimEnd() : ""
  }

  private buildResponseMatcher(responseXml: string): string {
    const regexPattern = this.escapeRegexSpecialCharacters(responseXml)
    const responseMatcher = this.replaceDynamicsWithRegexPatterns(regexPattern)
    return responseMatcher
  }

  /* Build up a response match regex pattern by taking the response xml and escaping:
    *   Regex special characters^,
    *   Quotes,
    *   Runtime variables
    *
    *  ^  Note that pact-js is a wrapper for the ruby cli so the regex format must follow ruby conventions
    *     See https://bneijt.nl/pr/ruby-regular-expressions
    */
  private escapeRegexSpecialCharacters(responseXml: string): string {
    return responseXml
      .replace(/\\/g, "\\")     // prepend backslash with backslash
      .replace(/\./g, "\\.")    // prepend fullstop with backslash
      .replace(/\|/g, "\\|")    // prepend pipe with backslash
      .replace(/\(/g, "\\(")    // prepend opening bracket with backslash
      .replace(/\)/g, "\\)")    // prepend closing bracket with backslash
      .replace(/\[/g, "\\[")    // prepend opening square bracket with backslash
      .replace(/]/g, "\\]")    // prepend closing square bracket with backslash
      .replace(/{/g, "\\{")    // prepend opening braces with backslash
      .replace(/}/g, "\\}")    // prepend closing braces with backslash
      .replace(/\+/g, "\\+")    // prepend plus with backslash
      .replace(/\^/g, "\\^")    // prepend ^ with backslash
      .replace(/\$/g, "\\$")    // prepend dollarsign with backslash
      .replace(/\*/g, "\\*")    // prepend star with backslash
      .replace(/\?/g, "\\?")    // prepend question mark with backslash
      .replace(/"/g, "\\\"")   // prepend quotes with backslash
      .replace(/\//g, "\\/")    // prepend forward slash with backslash
      .replace(/\n/g, "\n")     // replace newlines
  }

  /*
  * Replace any dynamic fields in the response xml which change at runtime with regex pattern match
  */
  private replaceDynamicsWithRegexPatterns(responseXml: string): string {
    return responseXml
      .replace(
        /<creationTime value=\\"[0-9]*\\"\\\/>/g,
        "<creationTime value=\\\"[0-9]*\\\"\\/>")
  }
}
