import * as XmlJs from "xml-js"
import * as crypto from "crypto-js"
import {writeXmlStringCanonicalized} from "../../serialisation/xml"
import {convertParentPrescription} from "./prescribe/parent-prescription"
import {convertFragmentsToHashableFormat, extractFragments} from "./signature"
import {fhir, processingErrors as errors} from "@models"
import {convertHL7V3DateTimeToIsoDateTimeString} from "../common/dateTime"
import pino from "pino"
import {identifyMessageType} from "../common"
import {getCourseOfTherapyTypeCode} from "./course-of-therapy-type"
import {createHash} from "../.../../../../../src/routes/util"

export function convertFhirMessageToSignedInfoMessage(bundle: fhir.Bundle, logger: pino.Logger): fhir.Parameters {
  const messageType = identifyMessageType(bundle)
  if (messageType !== fhir.EventCodingCode.PRESCRIPTION) {
    throw new errors.InvalidValueError(
      "MessageHeader.eventCoding.code must be 'prescription-order'.",
      "MessageHeader.eventCoding.code"
    )
  }

  const parentPrescription = convertParentPrescription(bundle, logger)
  const fragments = extractFragments(parentPrescription)
  const fragmentsToBeHashed = convertFragmentsToHashableFormat(fragments)
  const base64Digest = createParametersDigest(fragmentsToBeHashed)
  const isoTimestamp = convertHL7V3DateTimeToIsoDateTimeString(fragments.time)
  return createParameters(base64Digest, isoTimestamp)
}

export function createParametersDigest(fragmentsToBeHashed: string): string {
  const useSHA256 = !!process.env.USE_SHA256_PREPARE

  const digestValue = createHash(fragmentsToBeHashed, useSHA256, crypto.enc.Base64)
  const signedInfo: XmlJs.ElementCompact = {
    SignedInfo: {
      _attributes: {
        xmlns: "http://www.w3.org/2000/09/xmldsig#"
      },
      CanonicalizationMethod: new AlgorithmIdentifier("http://www.w3.org/2001/10/xml-exc-c14n#"),
      SignatureMethod: useSHA256
        ? new AlgorithmIdentifier("http://www.w3.org/2000/09/xmldsig#rsa-sha256") //Check this
        : new AlgorithmIdentifier("http://www.w3.org/2000/09/xmldsig#rsa-sha1"),
      Reference: {
        Transforms: {
          Transform: new AlgorithmIdentifier("http://www.w3.org/2001/10/xml-exc-c14n#")
        },
        DigestMethod: new AlgorithmIdentifier("http://www.w3.org/2000/09/xmldsig#sha1"),
        DigestValue: digestValue
      }
    }
  }

  return Buffer.from(writeXmlStringCanonicalized(signedInfo)).toString("base64")
}

function createParameters(base64Digest: string, isoTimestamp: string): fhir.Parameters {
  const digestParameter: fhir.StringParameter = {name: "digest", valueString: base64Digest}
  const timestampParameter: fhir.StringParameter = {name: "timestamp", valueString: isoTimestamp}
  const algorithmParameter: fhir.StringParameter = {name: "algorithm", valueString: "RS1"}
  return new fhir.Parameters([digestParameter, timestampParameter, algorithmParameter])
}

class AlgorithmIdentifier implements XmlJs.ElementCompact {
  _attributes: {
    Algorithm: string
  }

  constructor(algorithm: string) {
    this._attributes = {
      Algorithm: algorithm
    }
  }
}

export function isRepeatDispensing(medicationRequests: Array<fhir.MedicationRequest>): boolean {
  const courseOfTherapyTypeCode = getCourseOfTherapyTypeCode(medicationRequests)
  return courseOfTherapyTypeCode === fhir.CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING
}

export {
  convertBundleToSpineRequest,
  convertClaimToSpineRequest,
  convertParametersToSpineRequest,
  convertTaskToSpineRequest
} from "./payload"
