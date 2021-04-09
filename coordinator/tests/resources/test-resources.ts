import * as XmlJs from "xml-js"
import {ElementCompact} from "xml-js"
import * as fs from "fs"
import * as path from "path"
import * as LosslessJson from "lossless-json"
import {hl7V3, fhir, spine, fetcher} from "@models"

export class ExamplePrescription {
  description: string
  fhirMessageUnsigned: fhir.Bundle
  fhirMessageSigned: fhir.Bundle
  fhirMessageCancel: fhir.Bundle
  fhirMessageDispense: fhir.Bundle
  fhirMessageDigest: fhir.Parameters
  hl7V3Message: ElementCompact
  hl7V3MessageCancel: ElementCompact
  hl7V3MessageDispense: ElementCompact

  hl7V3SignatureFragments?: ElementCompact
  hl7V3FragmentsCanonicalized?: string

  constructor(description: string, search: string) {
    const location = getLocation(search)

    const fhirMessageUnsignedStr = fs.readFileSync(
      path.join(location, "1-Prepare-Request-200_OK.json"),
      "utf-8"
    )
    const fhirMessageSignedStr = fs.readFileSync(
      path.join(location, "1-Process-Request-Send-200_OK.json"),
      "utf-8"
    )
    const fhirMessageDigestStr = fs.readFileSync(
      path.join(location, "1-Prepare-Response-200_OK.json"),
      "utf-8"
    )
    const hl7V3MessageStr = fs.readFileSync(
      path.join(location, "1-Convert-Response-Send-200_OK.xml"),
      "utf-8"
    )

    this.description = description
    this.fhirMessageUnsigned = LosslessJson.parse(fhirMessageUnsignedStr)
    this.fhirMessageSigned = LosslessJson.parse(fhirMessageSignedStr)
    this.fhirMessageDigest = LosslessJson.parse(fhirMessageDigestStr)
    this.hl7V3Message = XmlJs.xml2js(hl7V3MessageStr, {compact: true})

    const fhirMessageCancelPath = path.join(location, "1-Process-Request-Cancel-200_OK.json")
    if (fs.existsSync(fhirMessageCancelPath)) {
      const fhirMessageCancelStr = fs.readFileSync(fhirMessageCancelPath, "utf-8")
      this.fhirMessageCancel = LosslessJson.parse(fhirMessageCancelStr)
    }

    const hl7V3MessageCancelPath = path.join(location, "1-Convert-Response-Cancel-200_OK.xml")
    if (fs.existsSync(hl7V3MessageCancelPath)) {
      const hl7V3MessageCancelStr = fs.readFileSync(hl7V3MessageCancelPath, "utf-8")
      this.hl7V3MessageCancel = XmlJs.xml2js(hl7V3MessageCancelStr, {compact: true})
    }

    const fhirMessageDispensePath = path.join(location, "1-Process-Request-Dispense-200_OK.json")
    if (fs.existsSync(fhirMessageDispensePath)) {
      const fhirMessageDispenseStr = fs.readFileSync(fhirMessageDispensePath, "utf-8")
      this.fhirMessageDispense = LosslessJson.parse(fhirMessageDispenseStr)
    }

    const hl7V3MessageDispensePath = path.join(location, "1-Convert-Response-Dispense-200_OK.xml")
    if (fs.existsSync(hl7V3MessageDispensePath)) {
      const hl7V3MessageDispenseStr = fs.readFileSync(hl7V3MessageDispensePath, "utf-8")
      this.hl7V3MessageDispense = XmlJs.xml2js(hl7V3MessageDispenseStr, {compact: true})
    }
  }
}

export const examplePrescription1 = new ExamplePrescription(
  "repeat dispensing",
  // eslint-disable-next-line max-len
  "secondary-care/community/repeat-dispensing/nominated-pharmacy/clinical-practitioner/multiple-medication-requests/prescriber-endorsed"
)

const hl7V3SignatureFragments1Str = fs.readFileSync(
  path.join(__dirname, "./signature-fragments/PrepareIntermediate-Hl7V3SignatureFragments.xml"),
  "utf8"
)
const hl7V3SignatureFragments1 = XmlJs.xml2js(hl7V3SignatureFragments1Str, {compact: true}) as ElementCompact
examplePrescription1.hl7V3SignatureFragments = hl7V3SignatureFragments1

const hl7V3SignatureFragmentsCanonicalized1 = fs.readFileSync(
  path.join(__dirname, "./signature-fragments/PrepareIntermediate-Hl7V3SignatureFragmentsCanonicalized.txt"),
  "utf8"
)
examplePrescription1.hl7V3FragmentsCanonicalized = hl7V3SignatureFragmentsCanonicalized1.replace("\n", "")

export const examplePrescription2 = new ExamplePrescription(
  "acute, nominated pharmacy",
  "secondary-care/community/acute/nominated-pharmacy/nurse/prescribing-and-professional-codes"
)

export const examplePrescription3 = new ExamplePrescription(
  "homecare",
  "secondary-care/homecare/acute/nominated-pharmacy/clinical-practitioner")

export const specification = [
  examplePrescription1,
  examplePrescription2,
  examplePrescription3
]

const taskBasePath = getLocation("secondary-care/homecare/acute/nominated-pharmacy/clinical-practitioner")
const withdrawTaskPath = `${taskBasePath}/3-Task-Request-Withdraw-200_OK.json`
export const exampleWithdrawTask = JSON.parse(fs.readFileSync(
  withdrawTaskPath,
  "utf-8"
)) as fhir.Task

const returnTaskPath = `${taskBasePath}/2-Task-Request-Return-200_OK.json`
export const exampleReturnTask = JSON.parse(fs.readFileSync(
  returnTaskPath,
  "utf-8"
)) as fhir.Task

export interface ExampleSpineResponse {
  response: spine.SpineDirectResponse<string>
  spineErrorCode: string | undefined
  epsErrorCode: string | undefined
  acknowledgementCode: hl7V3.AcknowledgementTypeCode
}

const asyncSuccess: ExampleSpineResponse = {
  response: {
    body: fs.readFileSync(
      path.join(__dirname, "./spine-responses/async_success.xml"),
      "utf8"
    ),
    statusCode: 200
  },
  spineErrorCode: undefined,
  epsErrorCode: undefined,
  acknowledgementCode: hl7V3.AcknowledgementTypeCode.ACKNOWLEDGED
}

const syncError: ExampleSpineResponse = {
  response: {
    body: fs.readFileSync(
      path.join(__dirname, "./spine-responses/sync_error.xml"),
      "utf8"
    ),
    statusCode: 400
  },
  spineErrorCode: "202",
  epsErrorCode: "ERROR",
  acknowledgementCode: hl7V3.AcknowledgementTypeCode.REJECTED
}

const asyncError: ExampleSpineResponse = {
  response: {
    body: fs.readFileSync(
      path.join(__dirname, "./spine-responses/async_error.xml"),
      "utf8"
    ),
    statusCode: 400
  },
  spineErrorCode: "5000",
  epsErrorCode: "ERROR",
  acknowledgementCode: hl7V3.AcknowledgementTypeCode.ERROR
}

const syncMultipleError: ExampleSpineResponse = {
  response: {
    body: fs.readFileSync(
      path.join(__dirname, "./spine-responses/sync_multiple_error.xml"),
      "utf8"
    ),
    statusCode: 400
  },
  spineErrorCode: "202",
  epsErrorCode: "ERROR",
  acknowledgementCode: hl7V3.AcknowledgementTypeCode.REJECTED
}

const asyncMultipleError: ExampleSpineResponse = {
  response: {
    body: fs.readFileSync(
      path.join(__dirname, "./spine-responses/async_multiple_error.xml"),
      "utf8"
    ),
    statusCode: 400
  },
  spineErrorCode: "5000",
  epsErrorCode: "ERROR",
  acknowledgementCode: hl7V3.AcknowledgementTypeCode.ERROR
}

const cancellationSuccess: ExampleSpineResponse = {
  response: {
    body: fs.readFileSync(
      path.join(__dirname, "./spine-responses/cancel_success.xml"),
      "utf8"
    ),
    statusCode: 200
  },
  spineErrorCode: "0001",
  epsErrorCode: "PATIENT_DECEASED",
  acknowledgementCode: hl7V3.AcknowledgementTypeCode.ACKNOWLEDGED
}

const cancellationError: ExampleSpineResponse = {
  response: {
    body: fs.readFileSync(
      path.join(__dirname, "./spine-responses/cancel_error.xml"),
      "utf8"
    ),
    statusCode: 400
  },
  spineErrorCode: "0008",
  epsErrorCode: "MISSING_VALUE",
  acknowledgementCode: hl7V3.AcknowledgementTypeCode.ERROR
}

const cancellationDispensedError: ExampleSpineResponse = {
  response: {
    body: fs.readFileSync(
      path.join(__dirname, "./spine-responses/cancel_error_dispensed.xml"),
      "utf8"
    ),
    statusCode: 400
  },
  spineErrorCode: "0004",
  epsErrorCode: "ERROR",
  acknowledgementCode: hl7V3.AcknowledgementTypeCode.ERROR
}

export const spineResponses = {
  success: asyncSuccess,
  singleErrors: [syncError, asyncError],
  multipleErrors: [syncMultipleError, asyncMultipleError],
  cancellationSuccess,
  cancellationError,
  cancellationDispensedError
}

function getLocation(search: string) {
  return fetcher
    .exampleFiles
    .filter(e => e.dir.includes(search))
    .find(e => e.number === "1")
    .dir
}
