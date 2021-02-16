import * as XmlJs from "xml-js"
import * as codes from "../../models/hl7-v3/hl7-v3-datatypes-codes"
import * as core from "../../models/hl7-v3/hl7-v3-datatypes-core"
import * as prescriptions from "../../models/hl7-v3/hl7-v3-prescriptions"
import * as fhir from "../../models/fhir/fhir-resources"
import * as cancellations from "../../models/hl7-v3/hl7-v3-cancellation"
import * as crypto from "crypto-js"
import {createReleaseRequestSendMessagePayload, createSendMessagePayload} from "./messaging/send-message-payload"
import {writeXmlStringCanonicalized} from "../serialisation/xml"
import {convertParentPrescription} from "./prescription/parent-prescription"
import {convertCancellation} from "./prescription/cancellation"
import {convertFragmentsToHashableFormat, extractFragments} from "./prescription/signature"
import {convertHL7V3DateTimeToIsoDateTimeString} from "./common"
import * as requestBuilder from "../formatters/ebxml-request-builder"
import {SpineRequest} from "../../models/spine"
import {identifyMessageType, MessageType} from "../../routes/util"
import {InvalidValueError} from "../../models/errors/processing-errors"
import {translateReleaseRequest} from "./dispention/release"

export function convertFhirMessageToSpineRequest(fhirMessage: fhir.Bundle): SpineRequest {
  const messageType = identifyMessageType(fhirMessage)
  return messageType === MessageType.PRESCRIPTION
    ? requestBuilder.toSpineRequest(createParentPrescriptionSendMessagePayload(fhirMessage))
    : requestBuilder.toSpineRequest(createCancellationSendMessagePayload(fhirMessage))
}

export function createParentPrescriptionSendMessagePayload(
  fhirBundle: fhir.Bundle
): core.SendMessagePayload<prescriptions.ParentPrescriptionRoot> {
  const parentPrescription = convertParentPrescription(fhirBundle)
  const parentPrescriptionRoot = new prescriptions.ParentPrescriptionRoot(parentPrescription)
  const interactionId = codes.Hl7InteractionIdentifier.PARENT_PRESCRIPTION_URGENT
  return createSendMessagePayload(interactionId, fhirBundle, parentPrescriptionRoot)
}

export function createCancellationSendMessagePayload(
  fhirBundle: fhir.Bundle
): core.SendMessagePayload<cancellations.CancellationPrescriptionRoot> {
  const cancellationRequest = convertCancellation(fhirBundle)
  const cancellationRequestRoot = new cancellations.CancellationPrescriptionRoot(cancellationRequest)
  const interactionId = codes.Hl7InteractionIdentifier.CANCEL_REQUEST
  return createSendMessagePayload(interactionId, fhirBundle, cancellationRequestRoot)
}

export function convertFhirMessageToSignedInfoMessage(fhirMessage: fhir.Bundle): fhir.Parameters {
  const messageType = identifyMessageType(fhirMessage)
  if (messageType !== MessageType.PRESCRIPTION) {
    throw new InvalidValueError(
      "MessageHeader.eventCoding.code must be 'prescription-order'.",
      "MessageHeader.eventCoding.code"
    )
  }

  const parentPrescription = convertParentPrescription(fhirMessage)
  const fragments = extractFragments(parentPrescription)
  const fragmentsToBeHashed = convertFragmentsToHashableFormat(fragments)
  const base64Digest = createParametersDigest(fragmentsToBeHashed)
  const isoTimestamp = convertHL7V3DateTimeToIsoDateTimeString(fragments.time)
  return createParameters(base64Digest, isoTimestamp)
}

export function createParametersDigest(fragmentsToBeHashed: string): string {
  const digestValue = crypto.SHA1(fragmentsToBeHashed).toString(crypto.enc.Base64)

  const signedInfo = {
    SignedInfo: {
      _attributes: {
        xmlns: "http://www.w3.org/2000/09/xmldsig#"
      },
      CanonicalizationMethod: new AlgorithmIdentifier("http://www.w3.org/2001/10/xml-exc-c14n#"),
      SignatureMethod: new AlgorithmIdentifier("http://www.w3.org/2000/09/xmldsig#rsa-sha1"),
      Reference: {
        Transforms: {
          Transform: new AlgorithmIdentifier("http://www.w3.org/2001/10/xml-exc-c14n#")
        },
        DigestMethod: new AlgorithmIdentifier("http://www.w3.org/2000/09/xmldsig#sha1"),
        DigestValue: digestValue
      }
    }
  } as XmlJs.ElementCompact

  return Buffer.from(writeXmlStringCanonicalized(signedInfo)).toString("base64")
}

function createParameters(base64Digest: string, isoTimestamp: string): fhir.Parameters {
  const parameters = []
  parameters.push({name: "digest", valueString: base64Digest})
  parameters.push({name: "timestamp", valueString: isoTimestamp})
  parameters.push({name: "algorithm", valueString: "RS1"})
  return new fhir.Parameters(parameters)
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

export function convertFhirMessageToReleaseRequest(fhirMessage: fhir.Parameters): SpineRequest {
  const hl7ReleaseRequest = translateReleaseRequest(fhirMessage)
  const interactionId = codes.Hl7InteractionIdentifier.NOMINATED_PRESCRIPTION_RELEASE_REQUEST
  return  requestBuilder.toSpineRequest(createReleaseRequestSendMessagePayload(interactionId, hl7ReleaseRequest))
}
