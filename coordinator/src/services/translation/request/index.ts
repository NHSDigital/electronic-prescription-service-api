import * as XmlJs from "xml-js"
import * as codes from "../../../models/hl7-v3/codes"
import * as prescriptions from "../../../models/hl7-v3/parent-prescription"
import * as cancellations from "../../../models/hl7-v3/cancellation-request"
import * as crypto from "crypto-js"
import {createSendMessagePayload} from "./send-message-payload"
import {writeXmlStringCanonicalized} from "../../serialisation/xml"
import {convertParentPrescription} from "./prescription/parent-prescription"
import {convertCancellation} from "./cancellation/cancellation"
import {convertFragmentsToHashableFormat, extractFragments} from "./signature"
import * as requestBuilder from "../../communication/ebxml-request-builder"
import {SpineRequest} from "../../../models/spine"
import {identifyMessageType} from "../../../routes/util"
import {InvalidValueError} from "../../../models/errors/processing-errors"
import {convertHL7V3DateTimeToIsoDateTimeString} from "../common/dateTime"
import {EventCodingCode} from "../../../models/fhir/message-header"
import {SendMessagePayload} from "../../../models/hl7-v3/messaging"
import {Parameters} from "../../../models/fhir/parameters"
import {Bundle} from "../../../models/fhir/bundle"

export function convertFhirMessageToSpineRequest(fhirMessage: Bundle): SpineRequest {
  const messageType = identifyMessageType(fhirMessage)
  return messageType === EventCodingCode.PRESCRIPTION
    ? requestBuilder.toSpineRequest(createParentPrescriptionSendMessagePayload(fhirMessage))
    : requestBuilder.toSpineRequest(createCancellationSendMessagePayload(fhirMessage))
}

export function createParentPrescriptionSendMessagePayload(
  fhirBundle: Bundle
): SendMessagePayload<prescriptions.ParentPrescriptionRoot> {
  const parentPrescription = convertParentPrescription(fhirBundle)
  const parentPrescriptionRoot = new prescriptions.ParentPrescriptionRoot(parentPrescription)
  const interactionId = codes.Hl7InteractionIdentifier.PARENT_PRESCRIPTION_URGENT
  return createSendMessagePayload(interactionId, fhirBundle, parentPrescriptionRoot)
}

export function createCancellationSendMessagePayload(
  fhirBundle: Bundle
): SendMessagePayload<cancellations.CancellationRequestRoot> {
  const cancellationRequest = convertCancellation(fhirBundle)
  const cancellationRequestRoot = new cancellations.CancellationRequestRoot(cancellationRequest)
  const interactionId = codes.Hl7InteractionIdentifier.CANCEL_REQUEST
  return createSendMessagePayload(interactionId, fhirBundle, cancellationRequestRoot)
}

export function convertFhirMessageToSignedInfoMessage(fhirMessage: Bundle): Parameters {
  const messageType = identifyMessageType(fhirMessage)
  if (messageType !== EventCodingCode.PRESCRIPTION) {
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

function createParameters(base64Digest: string, isoTimestamp: string): Parameters {
  const parameters = []
  parameters.push({name: "digest", valueString: base64Digest})
  parameters.push({name: "timestamp", valueString: isoTimestamp})
  parameters.push({name: "algorithm", valueString: "RS1"})
  return new Parameters(parameters)
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
