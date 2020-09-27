/* eslint-disable */
import { ConvertSpec } from "./test-convert-specs"
import { ProcessSpec } from "./test-process-specs"
import { specificationSpecs } from "./test-specification-specs"

const sendSpec1 = new ProcessSpec(
  "./parent-prescription",
  "secondary-care/homecare/acute/no-nominated-pharmacy",
  "SendRequest-Success-1.json")

const convertSpec1 = new ConvertSpec(
  "./parent-prescription",
  "secondary-care/homecare/acute/no-nominated-pharmacy",
  "SendRequest-Success-1.json",
  "ConvertResponse-Success-1.xml")

const convertSpecs = [
  convertSpec1
]

const sendSpecs = [
  sendSpec1
]

export const prepareCases = [
  ...specificationSpecs.map(example => [example.description, example.fhirMessageUnsigned, example.fhirMessageDigest])
]

export const convertCases = [
  ...specificationSpecs.map(example => [`unsigned ${example.description}`, example.fhirMessageUnsigned, example.hl7V3MessageUnsignedStr, example.hl7V3MessageUnsignedMatcher]),
  ...specificationSpecs.map(example => [`signed ${example.description}`, example.fhirMessageSigned, example.hl7V3MessageSignedStr, example.hl7V3MessageSignedMatcher]),
  //...specification.filter(example => example.fhirMessageCancel).map(example => [`cancel ${example.description}`, example.fhirMessageCancel]),
  ...convertSpecs.map(spec => [spec.description, spec.request, spec.response, spec.responseMatcher])
]

export const sendCases = [
  ...specificationSpecs.map(example => [example.description, example.fhirMessageSigned]),
  ...specificationSpecs.filter(example => example.fhirMessageCancel).map(example => [`cancel ${example.description}`, example.fhirMessageCancel]),
  ...sendSpecs.map(spec => [spec.description, spec.request])
]
