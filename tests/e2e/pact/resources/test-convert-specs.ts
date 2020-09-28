/* eslint-disable */
import * as fs from "fs"
import * as path from "path"
import { Bundle } from "./fhir-resources"
import * as LosslessJson from "lossless-json"

export class ConvertSpec {
  description: string
  request: Bundle
  response: string
  responseMatcher: string

  constructor(baseLocation: string, location: string, requestFile: string, responseFile: string, description: string = null) {
    const requestString = fs.readFileSync(path.join(__dirname, baseLocation, location, requestFile), "utf-8")
    const requestJson = LosslessJson.parse(requestString)

    const responseXmlString = fs.readFileSync(path.join(__dirname, baseLocation, location, responseFile), "utf-8")

    this.description = 
      description  
        ? description 
        : location.replace(/\//g, " ")

    this.request = requestJson
    this.response = responseXmlString
    this.responseMatcher = this.buildResponseMatcher(responseXmlString)
  }

  private buildResponseMatcher(responseXml: string): string {
    const regexPattern = this.escapeRegexSpecialCharacters(responseXml)
    const responseMatcher = this.replaceDynamicsWithRegexPatterns(regexPattern)
    //fs.writeFileSync(path.join(__dirname, "./responseMatcher.txt"), responseMatcher)
    return responseMatcher
  }

  /* Build up a response match regex pattern by taking the response xml and escaping:
    *   Regex special characters^,
    *   Quotes
    *  and replacing dynamic datetimes 
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
      .replace(/\]/g, "\\]")    // prepend closing square bracket with backslash
      .replace(/\{/g, "\\{")    // prepend opening braces with backslash 
      .replace(/\}/g, "\\}")    // prepend closing braces with backslash
      .replace(/\+/g, "\\+")    // prepend plus with backslash
      .replace(/\^/g, "\\^")    // prepend ^ with backslash
      .replace(/\$/g, "\\$")    // prepend dollarsign with backslash
      .replace(/\*/g, "\\*")    // prepend star with backslash
      .replace(/\?/g, "\\?")    // prepend question mark with backslash
      .replace(/\"/g, "\\\"")   // prepend quotes with backslash
      .replace(/\//g, "\\/")    // prepend forward slash with backslash
      .replace(/\n/g, "\n")     // replace newlines
  }

  /*
  * Replace any dynamic fields in the response xml which change at runtime with regex pattern match
  */
  private replaceDynamicsWithRegexPatterns(responseXml: string): string {
    return responseXml
      .replace(/<creationTime value=\\\"[0-9]*\\\"\\\/>/g, "<creationTime value=\\\"[0-9]*\\\"\\\/>")
  }  
}
