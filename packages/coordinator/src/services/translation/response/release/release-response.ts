import {fhir, hl7V3} from "@models"
import * as uuid from "uuid"
import * as moment from "moment"
import * as pino from "pino"
import {toArray} from "../../common"
import {convertHL7V3DateTimeToIsoDateTimeString, convertMomentToISODateTime} from "../../common/dateTime"
import {createBundle} from "../../common/response-bundles"
import {convertResourceToBundleEntry} from "../common"
import {verifyPrescriptionSignature} from "../../../verification/signature-verification"
import {DispenseProposalReturnRoot} from "../../../../../../models/hl7-v3/return"
import {ReturnFactory} from "../../request/return/return-factory"
import {ReturnReasonCode} from "../../../../../../models/hl7-v3"

// Rob Gooch - We can go with just PORX_MT122003UK32 as UK30 prescriptions are not signed
// so not legal electronic prescriptions
const SUPPORTED_MESSAGE_TYPE = "PORX_MT122003UK32"

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
  entries: Array<fhir.Resource>): fhir.ResourceParameter<fhir.Bundle> {
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
  dispenseProposalReturns: Array<DispenseProposalReturnRoot>
}

export function translateReleaseResponse(
  releaseResponse: hl7V3.PrescriptionReleaseResponse,
  logger: pino.BaseLogger,
  returnFactory: ReturnFactory
): TranslationResponseResult {
  const releaseRequestId = releaseResponse.inFulfillmentOf.priorDownloadRequestRef.id._attributes.root
  const result = toArray(releaseResponse.component)
    .filter(component => component.templateId._attributes.extension === SUPPORTED_MESSAGE_TYPE)
    .reduce((results, component) => {
      const bundle = createInnerBundle(component.ParentPrescription, releaseRequestId)
      const errors = verifyPrescriptionSignature(component.ParentPrescription)
      if (errors.length === 0) {
        return {
          passedPrescriptions: results.passedPrescriptions.concat([bundle]),
          failedPrescriptions: results.failedPrescriptions,
          dispenseProposalReturns: results.dispenseProposalReturns
        }
      } else {
        const prescriptionId = component.ParentPrescription.id._attributes.root.toLowerCase()
        const logMessage = `[Verifying signature for prescription ID ${prescriptionId}]: `
        const errorsAndMessage = logMessage + errors.join(", ")
        logger.error(errorsAndMessage)
        const operationOutcome = createInvalidSignatureOutcome(bundle)
        const dispenseProposalReturn = returnFactory.create(
          releaseResponse,
          new ReturnReasonCode("0005", "Invalid Digital Signature"))
        return {
          passedPrescriptions: results.passedPrescriptions,
          failedPrescriptions: results.failedPrescriptions.concat([operationOutcome, bundle]),
          dispenseProposalReturns: results.dispenseProposalReturns.concat(dispenseProposalReturn)
        }
      }
    }, {passedPrescriptions: [], failedPrescriptions: [], dispenseProposalReturns: []})

  const passedPrescriptionsBundle = createPrescriptionsBundleParameter(
    "passedPrescriptions",
    releaseResponse,
    result.passedPrescriptions)
  const failedPrescriptionBundle = createPrescriptionsBundleParameter(
    "failedPrescriptions",
    releaseResponse,
    result.failedPrescriptions)
  return {
    translatedResponse: {
      resourceType: "Parameters",
      parameter: [
        passedPrescriptionsBundle,
        failedPrescriptionBundle
      ]
    },
    dispenseProposalReturns: result.dispenseProposalReturns
  }
}

export function createInnerBundle(parentPrescription: hl7V3.ParentPrescription, releaseRequestId: string): fhir.Bundle {
  return createBundle(parentPrescription, releaseRequestId)
}
