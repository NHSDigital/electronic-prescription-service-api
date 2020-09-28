/* eslint-disable */
import { ConvertSpec } from "./test-convert-specs"
import { PrepareSpec } from "./test-prepare-specs"
import { ProcessSpec } from "./test-process-specs"

// Convert

const convertUnsignedSpecificationSuccessExamples = [1,2,3,4].map(i => new ConvertSpec(
  `./parent-prescription-${i}`,
  ".",
  "PrepareRequest-FhirMessageUnsigned.json",
  "ConvertResponse-UnsignedHl7V3Message.xml",
  `parent-prescription-${i} specification example unsigned`))

const convertSignedSpecificationSuccessExamples = [2].map(i => new ConvertSpec(
  `./parent-prescription-${i}`,
  ".",
  "SendRequest-FhirMessageSigned.json",
  "ConvertResponse-SignedHl7V3Message.xml",
  `parent-prescription-${i} specification example signed`))

const convertCancelSpecificationSuccessExamples = [3].map(i => new ConvertSpec(
  `./parent-prescription-${i}`,
  ".",
  "CancelRequest-FhirMessage.json",
  "CancelResponse-Hl7V3Message.xml",
  `parent-prescription-${i} specification example cancel`))

const convertHomecareAcuteNoNominatedPharmacySuccess = new ConvertSpec(
  "./parent-prescription",
  "secondary-care/homecare/acute/no-nominated-pharmacy",
  "SendRequest-Success-1.json",
  "ConvertResponse-Success-1.xml")

const convertSpecs = [
  ...convertUnsignedSpecificationSuccessExamples,
  ...convertSignedSpecificationSuccessExamples,
  ...convertCancelSpecificationSuccessExamples,
  convertHomecareAcuteNoNominatedPharmacySuccess
]

// Prepare

const prepareSpecificationSuccessExamples = [1,2].map(i => new PrepareSpec(
  `./parent-prescription-${i}`,
  ".",
  "PrepareRequest-FhirMessageUnsigned.json",
  "PrepareResponse-FhirMessageDigest.json",
  `parent-prescription-${i} specification example unsigned`))

const prepareHomecareAcuteNoNominatedPharmacySuccess = new PrepareSpec(
  "./parent-prescription",
  "secondary-care/homecare/acute/no-nominated-pharmacy",
  "PrepareRequest-Success-1.json",
  "PrepareResponse-Success-1.json")

const prepareSpecs = [
  ...prepareSpecificationSuccessExamples,
  prepareHomecareAcuteNoNominatedPharmacySuccess
]

// Send

const sendSpecificationSuccessExamples = [1,2].map(i => new ProcessSpec(
  `./parent-prescription-${i}`,
  ".",
  "SendRequest-FhirMessageSigned.json",
  `parent-prescription-${i} specification example unsigned`))

const sendHomecareAcuteNoNominatedPharmacySuccess = new ProcessSpec(
  "./parent-prescription",
  "secondary-care/homecare/acute/no-nominated-pharmacy",
  "SendRequest-Success-1.json")

const sendSpecs = [
  ...sendSpecificationSuccessExamples,
  sendHomecareAcuteNoNominatedPharmacySuccess
]

// Export Test Cases

export const convertCases = convertSpecs.map(spec => [spec.description, spec.request, spec.response, spec.responseMatcher])
export const prepareCases = prepareSpecs.map(spec => [spec.description, spec.request, spec.response])
export const sendCases = sendSpecs.map(spec => [spec.description, spec.request])
