import {fhir, hl7V3} from "@models"
import * as uuid from "uuid"
import * as moment from "moment"
import {toArray} from "../../common"
import {convertHL7V3DateTimeToIsoDateTimeString, convertMomentToISODateTime} from "../../common/dateTime"
import {createBundle} from "../../common/response-bundles"
import {convertResourceToBundleEntry} from "../common"
import {verifyPrescriptionSignature} from "../../../verification/signature-verification"

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
          code: "INVALID",
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
      type: "collection",
      total: entries.length,
      entry: entries.map(convertResourceToBundleEntry)
    }
  }
}

export function translateReleaseResponse(releaseResponse: hl7V3.PrescriptionReleaseResponse): fhir.Parameters {
  const releaseRequestId = releaseResponse.inFulfillmentOf.priorDownloadRequestRef.id._attributes.root
  const parentPrescriptions = toArray(releaseResponse.component)
    .filter(component => component.templateId._attributes.extension === SUPPORTED_MESSAGE_TYPE)
    .map(component => ({
      prescription: component.ParentPrescription,
      errors: verifyPrescriptionSignature(component.ParentPrescription)
    }))
  const passedPrescriptions = parentPrescriptions.filter(prescriptionResult => prescriptionResult.errors.length === 0)
    .map(prescriptionResult => createInnerBundle(prescriptionResult.prescription, releaseRequestId))
  const failedPrescriptions = parentPrescriptions.filter(prescriptionResult => prescriptionResult.errors.length > 0)
    .map(prescriptionResult => createInnerBundle(prescriptionResult.prescription, releaseRequestId))
    .flatMap(bundle => [createInvalidSignatureOutcome(bundle), bundle])
  return {
    resourceType: "Parameters",
    parameter: [
      createPrescriptionsBundleParameter("passedPrescriptions", releaseResponse, passedPrescriptions),
      createPrescriptionsBundleParameter("failedPrescriptions", releaseResponse, failedPrescriptions)
    ]
  }
}

export function createInnerBundle(parentPrescription: hl7V3.ParentPrescription, releaseRequestId: string): fhir.Bundle {
  return createBundle(parentPrescription, releaseRequestId)
}
