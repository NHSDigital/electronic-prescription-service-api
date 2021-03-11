import * as XmlJs from "xml-js"
import * as crypto from "crypto-js"
import {createReleaseRequestSendMessagePayload, createSendMessagePayload} from "./send-message-payload"
import {writeXmlStringCanonicalized} from "../../serialisation/xml"
import {convertParentPrescription} from "./prescribe/parent-prescription"
import {convertCancellation} from "./cancel/cancellation"
import {convertFragmentsToHashableFormat, extractFragments} from "./signature"
import * as requestBuilder from "../../communication/ebxml-request-builder"
import {SpineRequest} from "../../../models/spine"
import {identifyMessageType} from "../../../routes/util"
import {InvalidValueError} from "../../../models/errors/processing-errors"
import {convertHL7V3DateTimeToIsoDateTimeString} from "../common/dateTime"
import * as hl7V3 from "../../../models/hl7-v3"
import * as fhir from "../../../models/fhir"
import {convertDispenseNotification} from "./prescribe/prescription-dispense"
import {translateReleaseRequest} from "./dispense/release"
import pino from "pino"

export function convertBundleToSpineRequest(bundle: fhir.Bundle, messageId: string): SpineRequest {
  const messageType = identifyMessageType(bundle)
  const payload = createPayload(messageType, bundle)
  return requestBuilder.toSpineRequest(payload, messageId)
}

function createPayload(messageType: string, bundle: fhir.Bundle): hl7V3.SendMessagePayload<unknown> {
  switch (messageType) {
    case fhir.EventCodingCode.PRESCRIPTION:
      return createParentPrescriptionSendMessagePayload(bundle)
    case fhir.EventCodingCode.CANCELLATION:
      return createCancellationSendMessagePayload(bundle)
    case fhir.EventCodingCode.DISPENSE:
      return createDispenseNotificationSendMessagePayload(bundle)
  }
}

export function createParentPrescriptionSendMessagePayload(
  bundle: fhir.Bundle
): hl7V3.SendMessagePayload<hl7V3.ParentPrescriptionRoot> {
  const parentPrescription = convertParentPrescription(bundle)
  const parentPrescriptionRoot = new hl7V3.ParentPrescriptionRoot(parentPrescription)
  const interactionId = hl7V3.Hl7InteractionIdentifier.PARENT_PRESCRIPTION_URGENT
  return createSendMessagePayload(interactionId, bundle, parentPrescriptionRoot)
}

export function createDispenseNotificationSendMessagePayload(
  bundle: fhir.Bundle
): hl7V3.SendMessagePayload<hl7V3.DispenseNotificationRoot> {
  const dispenseNotification = convertDispenseNotification(bundle)
  const dispenseNotificationRoot = new hl7V3.DispenseNotificationRoot(dispenseNotification)
  const interactionId = hl7V3.Hl7InteractionIdentifier.DISPENSE_NOTIFICATION
  return createSendMessagePayload(interactionId, bundle, dispenseNotificationRoot)
}

export function createCancellationSendMessagePayload(
  bundle: fhir.Bundle
): hl7V3.SendMessagePayload<hl7V3.CancellationRequestRoot> {
  const cancellationRequest = convertCancellation(bundle)
  const cancellationRequestRoot = new hl7V3.CancellationRequestRoot(cancellationRequest)
  const interactionId = hl7V3.Hl7InteractionIdentifier.CANCEL_REQUEST
  return createSendMessagePayload(interactionId, bundle, cancellationRequestRoot)
}

export function convertFhirMessageToSignedInfoMessage(bundle: fhir.Bundle): fhir.Parameters {
  const messageType = identifyMessageType(bundle)
  if (messageType !== fhir.EventCodingCode.PRESCRIPTION) {
    throw new InvalidValueError(
      "MessageHeader.eventCoding.code must be 'prescription-order'.",
      "MessageHeader.eventCoding.code"
    )
  }

  const parentPrescription = convertParentPrescription(bundle)
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

export async function convertParametersToSpineRequest(
  fhirMessage: fhir.Parameters,
  messageId: string,
  logger: pino.Logger
): Promise<SpineRequest> {
  const hl7ReleaseRequest = await translateReleaseRequest(fhirMessage, logger)
  const interactionId = hl7V3.Hl7InteractionIdentifier.NOMINATED_PRESCRIPTION_RELEASE_REQUEST
  return  requestBuilder.toSpineRequest(
    createReleaseRequestSendMessagePayload(interactionId, hl7ReleaseRequest),
    messageId
  )
}
