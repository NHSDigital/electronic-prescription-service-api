import {fhir, hl7V3} from "@models"
import * as uuid from "uuid"
import * as moment from "moment"
import * as pino from "pino"
import {toArray} from "../../common"
import {convertHL7V3DateTimeToIsoDateTimeString, convertMomentToISODateTime} from "../../common/dateTime"
import {createBundle} from "../../common/response-bundles"
import {convertResourceToBundleEntry} from "../common"
import {verifyPrescriptionSignature} from "../../../verification/signature-verification"
import {ReturnFactory} from "../../request/return/return-factory"

// Rob Gooch - We can go with just PORX_MT122003UK32 as UK30 prescriptions are not signed
// so not legal electronic prescriptions
const SUPPORTED_MESSAGE_TYPE = "PORX_MT122003UK32"
const isPrescriptionTypeSupported = (component: hl7V3.PrescriptionReleaseResponseComponent): boolean => {
  return component.templateId._attributes.extension === SUPPORTED_MESSAGE_TYPE
}

const REASON_CODE_INVALID_DIGITAL_SIGNATURE = new hl7V3.ReturnReasonCode("0005", "Invalid Digital Signature")

function createInvalidSignatureOutcome(prescription: fhir.Bundle): fhir.OperationOutcome {
  const extension: fhir.IdentifierReferenceExtension<fhir.Bundle> = {
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-Spine-supportingInfo-prescription",
    valueReference: {identifier: prescription.identifier}
  }
  return {
    resourceType: "OperationOutcome",
    meta: {
      lastUpdated: convertMomentToISODateTime(moment.utc())
    },
    extension: [extension],
    issue: [{
      severity: "error",
      code: fhir.IssueCodes.INVALID,
      details: {
        coding: [{
          system: "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
          code: "INVALID_VALUE",
          display: "Signature is invalid."
        }]
      },
      expression: ["Provenance.signature.data"]
    }]
  }
}

function createPrescriptionsBundleParameter(
  name: string,
  releaseResponse: hl7V3.PrescriptionReleaseResponse,
  entries: Array<fhir.Resource>
): fhir.ResourceParameter<fhir.Bundle> {
  return {
    name,
    resource: {
      resourceType: "Bundle",
      id: uuid.v4(),
      meta: {
        lastUpdated: convertHL7V3DateTimeToIsoDateTimeString(releaseResponse.effectiveTime)
      },
      identifier: {
        system: "https://tools.ietf.org/html/rfc4122",
        value: releaseResponse.id._attributes.root.toLowerCase()
      },
      type: "searchset",
      total: entries.length,
      entry: entries.map(convertResourceToBundleEntry)
    }
  }
}

export type TranslationResponseResult = {
  translatedResponse: fhir.Parameters,
  dispenseProposalReturns: Array<hl7V3.DispenseProposalReturnRoot>
}

const logSignatureVerificationFailure = (
  prescriptionId: string,
  errors: Array<string>,
  logger: pino.Logger
): void => {
  const logMessage = `[Verifying signature for prescription ID ${prescriptionId}]: `
  const errorsAndMessage = logMessage + errors.join(", ")
  logger.error(errorsAndMessage)
}

export async function translateReleaseResponse(
  releaseResponse: hl7V3.PrescriptionReleaseResponse,
  logger: pino.Logger,
  returnFactory: ReturnFactory
): Promise<TranslationResponseResult> {
  const passedPrescriptions: Array<fhir.Bundle> = []
  const failedPrescriptions: Array<fhir.Bundle|fhir.OperationOutcome> = []
  const dispenseProposalReturns: Array<hl7V3.DispenseProposalReturnRoot> = []

  const releaseRequestId = releaseResponse.inFulfillmentOf.priorDownloadRequestRef.id._attributes.root
  const supportedPrescriptions = toArray(releaseResponse.component).filter(isPrescriptionTypeSupported)

  for (const component of supportedPrescriptions) {
    const bundle = createInnerBundle(component.ParentPrescription, releaseRequestId)
    const errors = await verifyPrescriptionSignature(component.ParentPrescription, logger)

    if (errors.length === 0) {
      passedPrescriptions.push(bundle)
    } else {
      const prescriptionId = component.ParentPrescription.id._attributes.root.toLowerCase()
      logSignatureVerificationFailure(prescriptionId, errors, logger)

      const operationOutcome = createInvalidSignatureOutcome(bundle)
      const dispenseProposalReturn = returnFactory.create(releaseResponse, REASON_CODE_INVALID_DIGITAL_SIGNATURE)

      failedPrescriptions.push(operationOutcome, bundle)
      dispenseProposalReturns.push(dispenseProposalReturn)
    }
  }

  const passedPrescriptionsBundle = createPrescriptionsBundleParameter(
    "passedPrescriptions",
    releaseResponse,
    passedPrescriptions
  )

  const failedPrescriptionBundle = createPrescriptionsBundleParameter(
    "failedPrescriptions",
    releaseResponse,
    failedPrescriptions
  )

  return {
    translatedResponse: {
      resourceType: "Parameters",
      parameter: [
        passedPrescriptionsBundle,
        failedPrescriptionBundle
      ]
    },
    dispenseProposalReturns
  }
}

export function createInnerBundle(parentPrescription: hl7V3.ParentPrescription, releaseRequestId: string): fhir.Bundle {
  return createBundle(parentPrescription, releaseRequestId)
}
