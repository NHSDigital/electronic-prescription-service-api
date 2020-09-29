/* eslint-disable */
import * as uuid from "uuid"
import fs from "fs"
import path from "path"
import {ConvertSpec} from "./test-convert-specs"
import {PrepareSpec} from "./test-prepare-specs"
import {ProcessSpec} from "./test-process-specs"

// Convert by convention example

const walk = function(dir) {
  var results = [];
  var list = fs.readdirSync(dir);
  list.forEach(function(file) {
      file = dir + '/' + file;
      var stat = fs.statSync(file);
      if (stat && stat.isDirectory()) { 
          results = results.concat(walk(file));
      } else { 
          results.push(file);
      }
  });
  return results;
}

const allExamplePaths: Array<string> = walk(path.join(__dirname, "./parent-prescription"))
const convertResponsePaths = allExamplePaths.filter(examplePath => {
  const filename = path.basename(examplePath)
  return filename.endsWith(".xml")
})

const convertRequestPaths: Array<string> = allExamplePaths.filter(examplePath => {
  const filename = path.basename(examplePath)
  const isRequestFile = filename.endsWith(".json") && filename.split("-")[1] === "Request"
  if (isRequestFile) {
    const requestEndpoint = filename.split("-")[0]
    const convertResponseFilenames = convertResponsePaths.map(convertResponsePath => path.basename(convertResponsePath))
    const hasConvertResponse = convertResponseFilenames.some(convertResponseFilename => convertResponseFilename.startsWith(`Convert-Response-${requestEndpoint}`))
    return hasConvertResponse
  }
  return false
})

const convertExamples: string[][] = convertResponsePaths.map(convertResponsePath => 
  [
    path.parse(path.relative(path.join(__dirname, "parent-prescription"), convertResponsePath)).dir.replace(/\./g, "").replace(/\//g, " ") + " " + path.parse(convertResponsePath).name.split("-")[2].toLowerCase() + " " + path.parse(convertResponsePath).name.split("-")[3] + "_OK example no. " + path.parse(convertResponsePath).name.split("-")[4],
    convertRequestPaths.find(convertRequestPath =>
      path.basename(convertRequestPath).split("-")[0] === path.basename(convertResponsePath).split("-")[2]
      && path.parse(convertRequestPath).name.split("-")[3] === path.parse(convertResponsePath).name.split("-")[4]
    ),
    convertResponsePath
  ])

const convertSpecs = convertExamples.map(convertExample => new ConvertSpec(
  convertExample[0],
  convertExample[1],
  convertExample[2]
))

// Convert Old Examples

// const convertUnsignedSpecificationSuccessExamples = [1,2,3,4].map(i => new ConvertSpec(
//   `./parent-prescription-${i}`,
//   ".",
//   "PrepareRequest-FhirMessageUnsigned.json",
//   "ConvertResponse-UnsignedHl7V3Message.xml",
//   `parent-prescription-${i} specification example unsigned`))

// const convertSignedSpecificationSuccessExamples = [1,2,3,4].map(i => new ConvertSpec(
//   `./parent-prescription-${i}`,
//   ".",
//   "SendRequest-FhirMessageSigned.json",
//   "ConvertResponse-SignedHl7V3Message.xml",
//   `parent-prescription-${i} specification example signed`))

// const convertCancelSpecificationSuccessExamples = [3].map(i => new ConvertSpec(
//   `./parent-prescription-${i}`,
//   ".",
//   "CancelRequest-FhirMessage.json",
//   "CancelResponse-Hl7V3Message.xml",
//   `parent-prescription-${i} specification example cancel`))

// const convertSpecs = [
//   ...convertUnsignedSpecificationSuccessExamples,
//   ...convertSignedSpecificationSuccessExamples,
//   ...convertCancelSpecificationSuccessExamples,
// ]

// Prepare

const prepareSpecificationSuccessExamples = [1,2,3,4].map(i => new PrepareSpec(
  `./parent-prescription-${i}`,
  ".",
  "PrepareRequest-FhirMessageUnsigned.json",
  "PrepareResponse-FhirMessageDigest.json",
  `parent-prescription-${i} specification example unsigned`))

const prepareSpecs = [
  ...prepareSpecificationSuccessExamples
]

// Send

const sendSpecificationSuccessExamples = [1,2,3,4].map(i => new ProcessSpec(
  `./parent-prescription-${i}`,
  ".",
  "SendRequest-FhirMessageSigned.json",
  `parent-prescription-${i} specification example unsigned`))

const sendSpecs = [
  ...sendSpecificationSuccessExamples
]

// Export Test Cases

export const convertCases = convertSpecs.map(spec => [spec.description, spec.request, spec.response, spec.responseMatcher])
export const prepareCases = prepareSpecs.map(spec => [spec.description, spec.request, spec.response])
export const sendCases = sendSpecs.map(spec => [spec.description, spec.request])
