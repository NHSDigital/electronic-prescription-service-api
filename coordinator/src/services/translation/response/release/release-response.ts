import {fhir, hl7V3} from "@models"
import * as uuid from "uuid"
import {toArray} from "../../common"
import {convertHL7V3DateTimeToIsoDateTimeString} from "../../common/dateTime"
import {createBundle} from "../../common/response-bundles"
import {convertResourceToBundleEntry} from "../common"

const SUPPORTED_MESSAGE_TYPE = "PORX_MT122003UK32"

export function createOuterBundle(releaseResponse: hl7V3.PrescriptionReleaseResponse): fhir.Bundle {
  const releaseRequestId = releaseResponse.inFulfillmentOf.priorDownloadRequestRef.id._attributes.root
  const parentPrescriptions = toArray(releaseResponse.component)
    .filter(component => component.templateId._attributes.extension === SUPPORTED_MESSAGE_TYPE)
    .map(component => component.ParentPrescription)
  return {
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
    total: parentPrescriptions.length,
    entry: parentPrescriptions
      .map(parentPrescription => createInnerBundle(parentPrescription, releaseRequestId))
      .map(convertResourceToBundleEntry)
  }
}

export function createInnerBundle(parentPrescription: hl7V3.ParentPrescription, releaseRequestId: string): fhir.Bundle {
  return createBundle(parentPrescription, releaseRequestId)
}
