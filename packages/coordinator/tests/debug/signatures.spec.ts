import {readFileSync} from "fs"
import * as path from "path"
import {convertParentPrescription} from "../../src/services/translation/request/prescribe/parent-prescription"
import pino from "pino"
import {Bundle} from "../../../models/fhir"
import * as LosslessJson from "lossless-json"
import {ParentPrescription} from "../../../models/hl7-v3/parent-prescription"
import {extractFragments} from "../../src/services/translation/request/signature"

const logger = pino()

/* eslint-disable max-len */

const examplesDir = "../../../../examples"
const basePath = `${examplesDir}/primary-care/repeat-dispensing/nominated-pharmacy/medical-prescriber/author/gmc/responsible-party/medication-list/din`
const sendRequestFilePath = `${basePath}/1-Process-Request-Send-200_OK.json`
const verifyRequestFilePath = `${basePath}/1-VerifySignature-Request-200_OK.json`

test.skip("compare signature fragments for specific send and verify-signature FHIR prescription", () => {
  const sendFhirStr = readFileSync(
    path.join(__dirname, sendRequestFilePath),
    "utf-8"
  )
  const sendFhir: Bundle = LosslessJson.parse(sendFhirStr) as Bundle
  const parentPrescription1 = convertParentPrescription(
    sendFhir,
    logger
  ) as ParentPrescription
  const signatureFragments1 = extractFragments(parentPrescription1)
  expect(signatureFragments1).toMatchSnapshot()

  const verifyFhirStr = readFileSync(
    path.join(__dirname, verifyRequestFilePath),
    "utf-8"
  )
  const verifyFhir = LosslessJson.parse(verifyFhirStr) as Bundle
  const prescription = verifyFhir.entry[0].resource as Bundle
  const parentPrescription2 = convertParentPrescription(
    prescription,
    logger
  ) as ParentPrescription
  const signatureFragments2 = extractFragments(parentPrescription2)
  expect(signatureFragments2).toMatchSnapshot()

  expect(signatureFragments2).toMatchSnapshot(signatureFragments1)
})

/* eslint-enable max-len */
