import Hapi from "@hapi/hapi"
import {fhir, hl7V3} from "@models"
import pino from "pino"
import {getRequestId, getCorrelationId} from "../../../../utils/headers"
import * as uuid from "uuid"
import {
  getMessageIdFromBundle,
  getMessageIdFromClaim,
  getMessageIdFromTask,
  identifyMessageType
} from "../../common"
import {convertCancellation} from "../cancel/cancellation"
import {convertDispenseClaim} from "../dispense/dispense-claim"
import {convertDispenseNotification} from "../dispense/dispense-notification"
import {translateReleaseRequest} from "../dispense/release"
import {convertParentPrescription} from "../prescribe/parent-prescription"
import {convertTaskToDispenseProposalReturn} from "../return/return"
import {createSendMessagePayload} from "../send-message-payload"
import {convertTaskToEtpWithdraw} from "../withdraw/withdraw"

type BundleTranslationResult = hl7V3.ParentPrescriptionRoot
  | hl7V3.CancellationRequestRoot
  | hl7V3.DispenseNotificationRoot
  | hl7V3.DispenseClaimRoot

type ParametersTranslationResult = hl7V3.NominatedPrescriptionReleaseRequestWrapper
  | hl7V3.PatientPrescriptionReleaseRequestWrapper

type TaskTranslationResult = hl7V3.DispenseProposalReturnRoot | hl7V3.EtpWithdrawRoot

type ClaimTranslationResult = hl7V3.DispenseClaimRoot

type PayloadContent = BundleTranslationResult
  | TaskTranslationResult
  | ParametersTranslationResult
  | ClaimTranslationResult

type Payload<T extends PayloadContent> = {
  content: T,
  interactionId: hl7V3.Hl7InteractionIdentifier
}

type FactoryInput = fhir.Bundle | fhir.Task | fhir.Parameters | fhir.Claim

export abstract class PayloadFactory {
  protected abstract create(
    fhirResource: FactoryInput,
    logger?: pino.Logger
  ): Payload<PayloadContent>

  protected abstract getPayloadId(fhirResource: FactoryInput): string

  static forBundle(): PayloadFactory {
    return new BundleTranslationResultFactory()
  }

  static forTask(): PayloadFactory {
    return new TaskTranslationResultFactory()
  }

  static forParameters(): PayloadFactory {
    return new ParametersTranslationResultFactory()
  }

  static forClaim(): PayloadFactory {
    return new ClaimTranslationResultFactory()
  }

  public makeSendMessagePayload(
    fhirResource: FactoryInput,
    headers: Hapi.Util.Dictionary<string>,
    logger?: pino.Logger
  ): hl7V3.SendMessagePayload<PayloadContent> {
    this.logIdentifiers(fhirResource, headers, logger)

    const messageId = this.getPayloadId(fhirResource)
    const payload = this.create(fhirResource, logger)

    return createSendMessagePayload(messageId, payload.interactionId, headers, payload.content)
  }

  /**
   * Create a log message containing all the identifiers, to make debugging easier.
   */
  private logIdentifiers(
    fhirResource: FactoryInput,
    headers: Hapi.Util.Dictionary<string>,
    logger?: pino.Logger
  ) {
    if (!logger) return

    const requestId = getRequestId(headers)
    const correlationId = getCorrelationId(headers)
    const payloadId = this.getPayloadId(fhirResource)

    logger.info("Creating payload for Spine request", requestId, correlationId, payloadId)
  }
}

class BundleTranslationResultFactory extends PayloadFactory {
  getPayloadId(bundle: fhir.Bundle): string {
    return getMessageIdFromBundle(bundle)
  }

  create(bundle: fhir.Bundle, logger: pino.Logger): Payload<BundleTranslationResult> {
    const messageType = identifyMessageType(bundle)

    switch (messageType) {
      case fhir.EventCodingCode.PRESCRIPTION:
        return {
          content: this.createParentPrescription(bundle, logger),
          interactionId: hl7V3.Hl7InteractionIdentifier.PARENT_PRESCRIPTION_URGENT
        }

      case fhir.EventCodingCode.CANCELLATION:
        return {
          // TODO: pass logger?
          content: this.createCancellation(bundle),
          interactionId: hl7V3.Hl7InteractionIdentifier.CANCEL_REQUEST
        }

      case fhir.EventCodingCode.DISPENSE:
        return {
          content: this.createDispenseNotification(bundle, logger),
          interactionId: hl7V3.Hl7InteractionIdentifier.DISPENSE_NOTIFICATION
        }
    }
  }

  private createParentPrescription(bundle: fhir.Bundle, logger: pino.Logger): hl7V3.ParentPrescriptionRoot {
    const parentPrescription = convertParentPrescription(bundle, logger)
    return new hl7V3.ParentPrescriptionRoot(parentPrescription)
  }

  private createCancellation(bundle: fhir.Bundle): hl7V3.CancellationRequestRoot {
    const cancellationRequest = convertCancellation(bundle)
    return new hl7V3.CancellationRequestRoot(cancellationRequest)
  }

  private createDispenseNotification(bundle: fhir.Bundle, logger: pino.Logger): hl7V3.DispenseNotificationRoot {
    const dispenseNotification = convertDispenseNotification(bundle, logger)
    return new hl7V3.DispenseNotificationRoot(dispenseNotification)
  }
}

class TaskTranslationResultFactory extends PayloadFactory {
  getPayloadId(task: fhir.Task): string {
    return getMessageIdFromTask(task)
  }

  create(task: fhir.Task): Payload<TaskTranslationResult> {
    switch (task.status) {
      case fhir.TaskStatus.REJECTED:
        return {
          content: this.createDispenseProposalReturn(task),
          interactionId: hl7V3.Hl7InteractionIdentifier.DISPENSE_PROPOSAL_RETURN
        }
      case fhir.TaskStatus.IN_PROGRESS:
        return {
          content: this.createDispenserWithdraw(task),
          interactionId: hl7V3.Hl7InteractionIdentifier.DISPENSER_WITHDRAW
        }
    }
  }

  private createDispenseProposalReturn(task: fhir.Task): hl7V3.DispenseProposalReturnRoot {
    const dispenseProposalReturn = convertTaskToDispenseProposalReturn(task)
    return new hl7V3.DispenseProposalReturnRoot(dispenseProposalReturn)
  }

  private createDispenserWithdraw(task: fhir.Task): hl7V3.EtpWithdrawRoot {
    const etpWithdraw = convertTaskToEtpWithdraw(task)
    return new hl7V3.EtpWithdrawRoot(etpWithdraw)
  }
}

class ParametersTranslationResultFactory extends PayloadFactory {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getPayloadId(parameters: fhir.Parameters): string {
    // Parameters don't have a mandatory identifier field
    return uuid.v4()
  }

  create(parameters: fhir.Parameters): Payload<ParametersTranslationResult> {
    const hl7ReleaseRequest = translateReleaseRequest(parameters)
    const interactionId = hl7ReleaseRequest instanceof hl7V3.NominatedPrescriptionReleaseRequestWrapper
      ? hl7V3.Hl7InteractionIdentifier.NOMINATED_PRESCRIPTION_RELEASE_REQUEST
      : hl7V3.Hl7InteractionIdentifier.PATIENT_PRESCRIPTION_RELEASE_REQUEST

    return {
      content: hl7ReleaseRequest,
      interactionId: interactionId
    }
  }
}

class ClaimTranslationResultFactory extends PayloadFactory {
  getPayloadId(claim: fhir.Claim): string {
    return getMessageIdFromClaim(claim)
  }

  create(claim: fhir.Claim): Payload<ClaimTranslationResult> {
    const dispenseClaim = convertDispenseClaim(claim)
    const dispenseClaimRoot = new hl7V3.DispenseClaimRoot(dispenseClaim)

    return {
      content: dispenseClaimRoot,
      interactionId: hl7V3.Hl7InteractionIdentifier.DISPENSE_CLAIM_INFORMATION
    }
  }
}
