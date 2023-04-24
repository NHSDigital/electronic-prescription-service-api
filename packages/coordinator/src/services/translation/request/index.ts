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
import {createHash} from "../../../../src/routes/create-hash"
import {HashingAlgorithm, getPrepareHashingAlgorithmFromEnvVar} from "../common/hashingAlgorithm"

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
  const base64Digest = createParametersDigest(fragmentsToBeHashed, getPrepareHashingAlgorithmFromEnvVar())
  const isoTimestamp = convertHL7V3DateTimeToIsoDateTimeString(fragments.time)
  return createParameters(base64Digest, isoTimestamp)
}

export function createParametersDigest(fragmentsToBeHashed: string, hashingAlgorithm: HashingAlgorithm): string {
  const digestValue = createHash(fragmentsToBeHashed, hashingAlgorithm, crypto.enc.Base64)
  const signedInfo: XmlJs.ElementCompact = {
    SignedInfo: {
      _attributes: {
        xmlns: "http://www.w3.org/2000/09/xmldsig#"
      },
      CanonicalizationMethod: new AlgorithmIdentifier("http://www.w3.org/2001/10/xml-exc-c14n#"),
      SignatureMethod: getAlgorithmIdentifier(hashingAlgorithm),
      Reference: {
        Transforms: {
          Transform: new AlgorithmIdentifier("http://www.w3.org/2001/10/xml-exc-c14n#")
        },
        DigestMethod: getDigestMethod(hashingAlgorithm),
        DigestValue: digestValue
      }
    }
  }

  return Buffer.from(writeXmlStringCanonicalized(signedInfo)).toString("base64")
}

function getAlgorithmIdentifier(hashingAlgorithm: HashingAlgorithm): AlgorithmIdentifier {
  switch (hashingAlgorithm) {
    case HashingAlgorithm.SHA1:
      return new AlgorithmIdentifier("http://www.w3.org/2000/09/xmldsig#rsa-sha1")
    case HashingAlgorithm.SHA256:
      return new AlgorithmIdentifier("http://www.w3.org/2001/04/xmldsig-more#rsa-sha256")
  }
}

function getDigestMethod(hashingAlgorithm: HashingAlgorithm): AlgorithmIdentifier {
  switch (hashingAlgorithm) {
    case HashingAlgorithm.SHA1:
      return new AlgorithmIdentifier("http://www.w3.org/2000/09/xmldsig#sha1")
    case HashingAlgorithm.SHA256:
      return new AlgorithmIdentifier("http://www.w3.org/2001/04/xmlenc#sha256")
  }
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
