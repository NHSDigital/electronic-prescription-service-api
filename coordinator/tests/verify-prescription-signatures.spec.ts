import {readFileSync} from "fs"
import * as path from "path"
import {convertParentPrescription} from "../src/services/translation/request/prescribe/parent-prescription"
import pino from "pino"
import {Bundle} from "../../models/fhir"
import * as LosslessJson from "lossless-json"
import {ParentPrescription} from "../../models/hl7-v3/parent-prescription"
import {extractFragments} from "../src/services/translation/request/signature"

const logger = pino()

//eslint-disable-next-line max-len
const sendRequestFilePath = "../../examples/primary-care/repeat-dispensing/nominated-pharmacy/medical-prescriber/author/gmc/responsible-party/medication-list/din/1-Process-Request-Send-200_OK.json"
//eslint-disable-next-line max-len
const verifyRequestFilePath = "../../examples/primary-care/repeat-dispensing/nominated-pharmacy/medical-prescriber/author/gmc/responsible-party/medication-list/din/1-VerifySignature-Request-200_OK.json"

test.skip("compare signature fragments for send and verify-signature FHIR prescriptions", () => {
  const sendFhirStr = readFileSync(path.join(__dirname, sendRequestFilePath), "utf-8")
  const sendFhir: Bundle = LosslessJson.parse(sendFhirStr)
  const parentPrescription1 = convertParentPrescription(sendFhir, logger) as ParentPrescription
  const signatureFragments1 = extractFragments(parentPrescription1)
  expect(signatureFragments1).toMatchSnapshot()

  const verifyFhirStr = readFileSync(path.join(__dirname, verifyRequestFilePath), "utf-8")
  const verifyFhir = LosslessJson.parse(verifyFhirStr)
  const prescription = verifyFhir.entry[0].resource as Bundle
  const parentPrescription2 = convertParentPrescription(prescription, logger) as ParentPrescription
  const signatureFragments2 = extractFragments(parentPrescription2)
  expect(signatureFragments2).toMatchSnapshot()

  expect(signatureFragments2).toMatchInlineSnapshot(signatureFragments1)
})
