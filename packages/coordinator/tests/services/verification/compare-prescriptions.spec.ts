/* eslint-disable max-len */

import {readFileSync} from "fs"
import path from "path"
import * as LosslessJson from "lossless-json"
import {comparePrescriptions} from "../../../src/services/verification"
import {common, fhir} from "@models"

const basePath = "../../../../../examples/primary-care/repeat-dispensing/nominated-pharmacy/medical-prescriber/author/gmc/responsible-party/medication-list/din"
const sendRequestFilePath = `${basePath}/1-Process-Request-Send-200_OK.json`

const defaultPrescription: common.Prescription = {
  nhsNumber: "9990548609",
  prescriptionId: "4f2b64a2-0f32-401f-81f4-5e585bfa2e61",
  prescriptionShortFormId: "998244-A83008-238DCD",
  repeatsIssued: ""
}

test("build prescription returns correct values", async () => {
  const sendFhirStr = readFileSync(
    path.join(__dirname, sendRequestFilePath),
    "utf-8"
  )
  const sendFhir: fhir.Bundle = LosslessJson.parse(sendFhirStr) as fhir.Bundle
  const result = await common.buildPrescription(sendFhir)
  expect(result).toStrictEqual(defaultPrescription)
})

test("compare prescriptions returns no errors for matching prescriptions", () => {
  const prescription1: common.Prescription = {
    nhsNumber: "9990548609",
    prescriptionId: "4f2b64a2-0f32-401f-81f4-5e585bfa2e61",
    prescriptionShortFormId: "998244-A83008-238DCD",
    repeatsIssued: ""
  }
  const prescription2: common.Prescription = {
    nhsNumber: "9990548609",
    prescriptionId: "4f2b64a2-0f32-401f-81f4-5e585bfa2e61",
    prescriptionShortFormId: "998244-A83008-238DCD",
    repeatsIssued: ""
  }
  expect(comparePrescriptions(prescription1, prescription2)).toStrictEqual([])
})

const testCases = [
  ["nhsNumber", {...defaultPrescription, nhsNumber: "no-match", error: "Nhs Number does not match"}],
  ["prescriptionId", {...defaultPrescription, prescriptionId: "no-match", error: "Prescription Id does not match"}],
  ["prescriptionShortFormId", {...defaultPrescription, prescriptionShortFormId: "no-match", error: "Prescription Short Form Id does not match"}],
  ["repeatsIssued", {...defaultPrescription, repeatsIssued: "no-match", error: "Repeats Issued does not match"}]
]

test.each(testCases)("compare prescriptions with mismatching %p returns an error",
  (key: string, testCase: common.Prescription & {error: string}) => {
    const prescription: common.Prescription = {
      nhsNumber: "9990548609",
      prescriptionId: "4f2b64a2-0f32-401f-81f4-5e585bfa2e61",
      prescriptionShortFormId: "998244-A83008-238DCD",
      repeatsIssued: ""
    }
    expect(comparePrescriptions(prescription, testCase)).toStrictEqual([testCase.error])
  })

/* eslint-enable max-len */
