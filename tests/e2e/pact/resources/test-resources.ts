import {PrepareCase} from "../models/cases/prepare-case"
import {ProcessCase} from "../models/cases/process-case"
import {convertExamples} from "../services/convert-example-fetcher"

// Prepare

const prepareSpecificationSuccessExamples = [1,2,3,4].map(i => new PrepareCase(
  `./parent-prescription-${i}`,
  ".",
  "PrepareRequest-FhirMessageUnsigned.json",
  "PrepareResponse-FhirMessageDigest.json",
  `parent-prescription-${i} specification example unsigned`))

const prepareSpecs = [
  ...prepareSpecificationSuccessExamples
]

// Send

const sendSpecificationSuccessExamples = [1,2,3,4].map(i => new ProcessCase(
  `./parent-prescription-${i}`,
  ".",
  "SendRequest-FhirMessageSigned.json",
  `parent-prescription-${i} specification example unsigned`))

const sendSpecs = [
  ...sendSpecificationSuccessExamples
]

// Export Test Cases

export const convertCases = convertExamples.map(spec => [spec.description, spec.request, spec.response, spec.responseMatcher])
export const prepareCases = prepareSpecs.map(spec => [spec.description, spec.request, spec.response])
export const sendCases = sendSpecs.map(spec => [spec.description, spec.request])