import * as XmlJs from "xml-js"
import {ElementCompact} from "xml-js"
import * as fs from "fs"
import * as path from "path"
import {Bundle, Parameters} from "../../src/models/fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import {SpineDirectResponse} from "../../src/models/spine"
import {acknowledgementCodes} from "../../src/models/hl7-v3/hl7-v3-spine-response"

export class ExamplePrescription {
  description: string
  fhirMessageUnsigned: Bundle
  fhirMessageSigned: Bundle
  fhirMessageCancel: Bundle
  fhirMessageDigest: Parameters
  hl7V3Message: ElementCompact
  hl7V3MessageCancel: ElementCompact

  hl7V3SignatureFragments?: ElementCompact
  hl7V3FragmentsCanonicalized?: string

  constructor(description: string, location: string) {
    const fhirMessageUnsignedStr = fs.readFileSync(
      path.join(__dirname, location, "1-Prepare-Request-200_OK.json"),
      "utf-8"
    )
    const fhirMessageSignedStr = fs.readFileSync(
      path.join(__dirname, location, "1-Process-Request-Send-200_OK.json"),
      "utf-8"
    )
    const fhirMessageDigestStr = fs.readFileSync(
      path.join(__dirname, location, "1-Prepare-Response-200_OK.json"),
      "utf-8"
    )
    const hl7V3MessageStr = fs.readFileSync(
      path.join(__dirname, location, "1-Convert-Response-Send-200_OK.xml"),
      "utf-8"
    )

    this.description = description
    this.fhirMessageUnsigned = LosslessJson.parse(fhirMessageUnsignedStr)
    this.fhirMessageSigned = LosslessJson.parse(fhirMessageSignedStr)
    this.fhirMessageDigest = LosslessJson.parse(fhirMessageDigestStr)
    this.hl7V3Message = XmlJs.xml2js(hl7V3MessageStr, {compact: true})

    const fhirMessageCancelPath = path.join(__dirname, location, "CancelRequest-FhirMessage.json")
    if (fs.existsSync(fhirMessageCancelPath)) {
      const fhirMessageCancelStr = fs.readFileSync(fhirMessageCancelPath, "utf-8")
      this.fhirMessageCancel = LosslessJson.parse(fhirMessageCancelStr)
    }

    const hl7V3MessageCancelPath = path.join(__dirname, location, "CancelResponse-Hl7V3Message.xml")
    if (fs.existsSync(hl7V3MessageCancelPath)) {
      const hl7V3MessageCancelStr = fs.readFileSync(hl7V3MessageCancelPath, "utf-8")
      this.hl7V3MessageCancel = XmlJs.xml2js(hl7V3MessageCancelStr, {compact: true})
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
  "secondary-care/homecare/acute/no-nominated-pharmacy/clinical-practitioner")

/* todo: repeat-dispensing homecare example
export const examplePrescription4 = new ExamplePrescription(
  "homecare repeat dispensing",
  "secondary-care/homecare/acute/no-nominated-pharmacy"
) */

export const specification = [
  examplePrescription1,
  examplePrescription2,
  examplePrescription3
  //examplePrescription4
]

export interface ExampleSpineResponse {
  response: SpineDirectResponse<string>
  spineErrorCode: string | undefined
  acknowledgementCode: acknowledgementCodes
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
  acknowledgementCode: "AA"
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
  acknowledgementCode: "AR"
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
  acknowledgementCode: "AE"
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
  acknowledgementCode: "AR"
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
  acknowledgementCode: "AE"
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
  acknowledgementCode: "AA"
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
  acknowledgementCode: "AE"
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
  acknowledgementCode: "AE"
}

export const spineResponses = {
  success: asyncSuccess,
  singleErrors: [syncError, asyncError],
  multipleErrors: [syncMultipleError, asyncMultipleError],
  cancellationSuccess,
  cancellationError,
  cancellationDispensedError
}
