import * as XmlJs from "xml-js"
import * as crypto from "crypto-js"
import * as uuid from "uuid"
import {
  convertRequesterToControlActAuthor,
  convertResponsiblePractitionerToControlActAuthor,
  createSendMessagePayload, createSendMessagePayloadForUnattendedAccess
} from "./send-message-payload"
import {writeXmlStringCanonicalized} from "../../serialisation/xml"
import {convertParentPrescription} from "./prescribe/parent-prescription"
import {convertCancellation} from "./cancel/cancellation"
import {convertFragmentsToHashableFormat, extractFragments} from "./signature"
import * as requestBuilder from "../../communication/ebxml-request-builder"
import {spine, hl7V3, fhir, processingErrors as errors} from "@models"
import {convertHL7V3DateTimeToIsoDateTimeString} from "../common/dateTime"
import {convertDispenseNotification} from "./dispense/dispense-notification"
import {translateReleaseRequest} from "./dispense/release"
import pino from "pino"
import {convertTaskToDispenseProposalReturn} from "./return/return"
import {convertTaskToEtpWithdraw} from "./withdraw/withdraw"
import {getMessageIdFromBundle, getMessageIdFromTask, identifyMessageType} from "../common"
import {getCourseOfTherapyTypeCode} from "./course-of-therapy-type"

export async function convertBundleToSpineRequest(
  bundle: fhir.Bundle, messageId: string, logger: pino.Logger
): Promise<spine.SpineRequest> {
  const messageType = identifyMessageType(bundle)
  const payload = await createPayloadFromBundle(messageType, bundle, logger)
  return requestBuilder.toSpineRequest(payload, messageId)
}

type BundleTranslationResult = hl7V3.ParentPrescriptionRoot | hl7V3.CancellationRequestRoot
  | hl7V3.DispenseNotificationRoot

async function createPayloadFromBundle(
  messageType: string,
  bundle: fhir.Bundle,
  logger: pino.Logger
): Promise<hl7V3.SendMessagePayload<BundleTranslationResult>> {
  switch (messageType) {
    case fhir.EventCodingCode.PRESCRIPTION:
      return createParentPrescriptionSendMessagePayload(bundle)
    case fhir.EventCodingCode.CANCELLATION:
      return createCancellationSendMessagePayload(bundle)
    case fhir.EventCodingCode.DISPENSE:
      return await createDispenseNotificationSendMessagePayload(bundle, logger)
  }
}

export function createParentPrescriptionSendMessagePayload(
  bundle: fhir.Bundle
): hl7V3.SendMessagePayload<hl7V3.ParentPrescriptionRoot> {
  const parentPrescription = convertParentPrescription(bundle)
  const parentPrescriptionRoot = new hl7V3.ParentPrescriptionRoot(parentPrescription)
  const interactionId = hl7V3.Hl7InteractionIdentifier.PARENT_PRESCRIPTION_URGENT
  return createSendMessagePayload(
    getMessageIdFromBundle(bundle),
    interactionId,
    convertRequesterToControlActAuthor(bundle),
    parentPrescriptionRoot
  )
}

export async function createDispenseNotificationSendMessagePayload(
  bundle: fhir.Bundle,
  logger: pino.Logger
): Promise<hl7V3.SendMessagePayload<hl7V3.DispenseNotificationRoot>> {
  const dispenseNotification = await convertDispenseNotification(bundle, logger)
  const dispenseNotificationRoot = new hl7V3.DispenseNotificationRoot(dispenseNotification)
  return createSendMessagePayloadForUnattendedAccess(
    getMessageIdFromBundle(bundle),
    hl7V3.Hl7InteractionIdentifier.DISPENSE_NOTIFICATION,
    dispenseNotificationRoot
  )
}

export function createCancellationSendMessagePayload(
  bundle: fhir.Bundle
): hl7V3.SendMessagePayload<hl7V3.CancellationRequestRoot> {
  const cancellationRequest = convertCancellation(bundle)
  const cancellationRequestRoot = new hl7V3.CancellationRequestRoot(cancellationRequest)
  const interactionId = hl7V3.Hl7InteractionIdentifier.CANCEL_REQUEST
  return createSendMessagePayload(
    getMessageIdFromBundle(bundle),
    interactionId,
    convertResponsiblePractitionerToControlActAuthor(bundle),
    cancellationRequestRoot
  )
}

export function convertFhirMessageToSignedInfoMessage(bundle: fhir.Bundle): fhir.Parameters {
  const messageType = identifyMessageType(bundle)
  if (messageType !== fhir.EventCodingCode.PRESCRIPTION) {
    throw new errors.InvalidValueError(
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

  const signedInfo: XmlJs.ElementCompact = {
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
  }

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
  parameters: fhir.Parameters,
  messageId: string,
  logger: pino.Logger
): Promise<spine.SpineRequest> {
  const hl7ReleaseRequest = await translateReleaseRequest(parameters, logger)
  const interactionId = hl7ReleaseRequest instanceof hl7V3.NominatedPrescriptionReleaseRequestWrapper
    ? hl7V3.Hl7InteractionIdentifier.NOMINATED_PRESCRIPTION_RELEASE_REQUEST
    : hl7V3.Hl7InteractionIdentifier.PATIENT_PRESCRIPTION_RELEASE_REQUEST
  const sendMessagePayload = createSendMessagePayloadForUnattendedAccess(
    uuid.v4(),
    interactionId,
    hl7ReleaseRequest
  )
  return requestBuilder.toSpineRequest(sendMessagePayload, messageId)
}

export async function convertTaskToSpineRequest(
  task: fhir.Task,
  messageId: string,
  logger: pino.Logger
): Promise<spine.SpineRequest> {
  const payload = await createPayloadFromTask(task, logger)
  return requestBuilder.toSpineRequest(payload, messageId)
}

type TaskTranslationResult = hl7V3.DispenseProposalReturnRoot | hl7V3.EtpWithdrawRoot

async function createPayloadFromTask(
  task: fhir.Task,
  logger: pino.Logger
): Promise<hl7V3.SendMessagePayload<TaskTranslationResult>> {
  switch (task.status) {
    case fhir.TaskStatus.REJECTED:
      return await createDispenseProposalReturnSendMessagePayload(task, logger)
    case fhir.TaskStatus.IN_PROGRESS:
      return createDispenserWithdrawSendMessagePayload(task)
  }
}

async function createDispenseProposalReturnSendMessagePayload(task: fhir.Task, logger: pino.Logger) {
  const dispenseProposalReturn = await convertTaskToDispenseProposalReturn(task, logger)
  const dispenseProposalReturnRoot = new hl7V3.DispenseProposalReturnRoot(dispenseProposalReturn)
  return createSendMessagePayloadForUnattendedAccess(
    getMessageIdFromTask(task),
    hl7V3.Hl7InteractionIdentifier.DISPENSE_PROPOSAL_RETURN,
    dispenseProposalReturnRoot
  )
}

function createDispenserWithdrawSendMessagePayload(task: fhir.Task) {
  const etpWithdraw = convertTaskToEtpWithdraw(task)
  const etpWithdrawRoot = new hl7V3.EtpWithdrawRoot(etpWithdraw)
  return createSendMessagePayloadForUnattendedAccess(
    getMessageIdFromTask(task),
    hl7V3.Hl7InteractionIdentifier.DISPENSER_WITHDRAW,
    etpWithdrawRoot
  )
}

export function isRepeatDispensing(medicationRequests: Array<fhir.MedicationRequest>): boolean {
  const courseOfTherapyTypeCode = getCourseOfTherapyTypeCode(medicationRequests)
  return courseOfTherapyTypeCode === fhir.CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING
}
