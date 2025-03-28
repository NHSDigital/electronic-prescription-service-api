import Hapi from "@hapi/hapi"
import {fhir, hl7V3} from "@models"
import pino from "pino"
import * as uuid from "uuid"
import {
  getBundleIdentifierValue,
  getClaimIdentifierValue,
  getTaskIdentifierValue,
  identifyMessageType
} from "../../common"
import {convertCancellation} from "../cancel/cancellation"
import {convertDispenseClaim} from "../dispense/dispense-claim"
import {convertDispenseNotification} from "../dispense/dispense-notification"
import {translateReleaseRequest} from "../dispense/release"
import {convertParentPrescription} from "../prescribe/parent-prescription"
import {convertTaskToDispenseProposalReturn} from "../return/return"
import {convertTaskToEtpWithdraw} from "../withdraw/withdraw"
import {createSendMessagePayload as createSendMessagePayloadImplementation} from "./message"

type BundleTranslationResult = hl7V3.ParentPrescriptionRoot
  | hl7V3.CancellationRequestRoot
  | hl7V3.DispenseNotificationRoot
  | hl7V3.DispenseClaimRoot

type ParametersTranslationResult = hl7V3.NominatedPrescriptionReleaseRequestWrapper
  | hl7V3.PatientPrescriptionReleaseRequestWrapper

type TaskTranslationResult = hl7V3.DispenseProposalReturnRoot | hl7V3.EtpWithdrawRoot

type ClaimTranslationResult = hl7V3.DispenseClaimRoot

export type PayloadContent = BundleTranslationResult
  | TaskTranslationResult
  | ParametersTranslationResult
  | ClaimTranslationResult

type Payload<T extends PayloadContent> = {
  content: T,
  interactionId: hl7V3.Hl7InteractionIdentifier
}

type FactoryInput = fhir.Bundle | fhir.Task | fhir.Parameters | fhir.Claim

export abstract class SendMessagePayloadFactory {
  protected abstract createPayload(
    fhirResource: FactoryInput,
    logger?: pino.Logger
  ): Payload<PayloadContent>

  protected abstract getPayloadId(fhirResource: FactoryInput): string

  static forBundle(): SendMessagePayloadFactory {
    return new BundleTranslationResultFactory()
  }

  static forTask(): SendMessagePayloadFactory {
    return new TaskTranslationResultFactory()
  }

  static forParameters(): SendMessagePayloadFactory {
    return new ParametersTranslationResultFactory()
  }

  static forClaim(): SendMessagePayloadFactory {
    return new ClaimTranslationResultFactory()
  }

  public createSendMessagePayload(
    fhirResource: FactoryInput,
    headers: Hapi.Utils.Dictionary<string>,
    logger: pino.Logger
  ): hl7V3.SendMessagePayload<PayloadContent> {
    this.logIdentifiers(fhirResource, logger)

    const messageId = this.getPayloadId(fhirResource)
    const payload = this.createPayload(fhirResource, logger)

    return createSendMessagePayloadImplementation(messageId, payload.interactionId, headers, payload.content)
  }

  /*
   * Log resource identifier, to facilitate logs tracing on Splunk.
   */
  private logIdentifiers(fhirResource: FactoryInput, logger: pino.Logger) {
    const logObject = {
      payloadId: this.getPayloadId(fhirResource)
    }
    logger.info(logObject, "Creating Spine payload from FHIR resource")
  }
}

class BundleTranslationResultFactory extends SendMessagePayloadFactory {
  getPayloadId(bundle: fhir.Bundle): string {
    return getBundleIdentifierValue(bundle)
  }

  createPayload(bundle: fhir.Bundle, logger: pino.Logger): Payload<BundleTranslationResult> {
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
          content: this.createCancellation(bundle, logger),
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

  private createCancellation(bundle: fhir.Bundle, logger: pino.Logger): hl7V3.CancellationRequestRoot {
    const cancellationRequest = convertCancellation(bundle, logger)
    return new hl7V3.CancellationRequestRoot(cancellationRequest)
  }

  private createDispenseNotification(bundle: fhir.Bundle, logger: pino.Logger): hl7V3.DispenseNotificationRoot {
    const dispenseNotification = convertDispenseNotification(bundle, logger)
    return new hl7V3.DispenseNotificationRoot(dispenseNotification)
  }
}

class TaskTranslationResultFactory extends SendMessagePayloadFactory {
  getPayloadId(task: fhir.Task): string {
    return getTaskIdentifierValue(task)
  }

  createPayload(task: fhir.Task): Payload<TaskTranslationResult> {
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

class ParametersTranslationResultFactory extends SendMessagePayloadFactory {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getPayloadId(parameters: fhir.Parameters): string {
    // Parameters don't have a mandatory identifier field
    return uuid.v4()
  }

  createPayload(parameters: fhir.Parameters): Payload<ParametersTranslationResult> {
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

class ClaimTranslationResultFactory extends SendMessagePayloadFactory {
  getPayloadId(claim: fhir.Claim): string {
    return getClaimIdentifierValue(claim)
  }

  createPayload(claim: fhir.Claim): Payload<ClaimTranslationResult> {
    const dispenseClaim = convertDispenseClaim(claim)
    const dispenseClaimRoot = new hl7V3.DispenseClaimRoot(dispenseClaim)

    return {
      content: dispenseClaimRoot,
      interactionId: hl7V3.Hl7InteractionIdentifier.DISPENSE_CLAIM_INFORMATION
    }
  }
}
