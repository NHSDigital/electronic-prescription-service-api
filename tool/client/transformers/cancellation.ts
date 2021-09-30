import * as uuid from "uuid"
import {Bundle, BundleEntry, EventCodingCode, PractitionerRole} from "../models"
import {
  getMedicationRequestBundleEntries,
  getMessageHeaderBundleEntries,
  getPractitionerBundleEntries,
  getPractitionerRoleBundleEntries
} from "../parsers/read/bundle-parser"
import {pageData} from "../ui/state"
import * as fhirCommon from "../models/common"

export function createCancellation(bundle: Bundle): Bundle {
  // Fixes duplicate hl7v3 identifier error
  // this is not an obvious error for a supplier to resolve as
  // there is no mention of the fhir field it relates to
  // can we improve our returned error message here??
  bundle.identifier.value = uuid.v4()
  // ****************************************

  const messageHeaderEntry = getMessageHeaderBundleEntries(bundle.entry)[0]
  const messageHeader = messageHeaderEntry.resource
  messageHeader.eventCoding.code = EventCodingCode.CANCELLATION
  messageHeader.eventCoding.display = "Prescription Order Update"

  // remove focus references as references not in bundle causes validation errors
  // but no references always passes
  messageHeader.focus = []
  // ****************************************

  const medicationToCancelSnomed = (document.querySelectorAll(
    'input[name="cancel-medications"]:checked'
  )[0] as HTMLInputElement).value
  const medicationRequestEntries = getMedicationRequestBundleEntries(bundle.entry)

  const medicationEntryToCancel = medicationRequestEntries.filter(e =>
    e.resource.medicationCodeableConcept.coding.some(
      c => c.code === medicationToCancelSnomed
    )
  )[0]

  const clonedMedicationRequestEntry = JSON.parse(
    JSON.stringify(medicationEntryToCancel)
  )
  const medicationRequest = clonedMedicationRequestEntry.resource
  medicationRequest.status = "cancelled"
  const cancellationReason = pageData.reasons.filter(
    r => r.id === pageData.selectedCancellationReasonId
  )[0]
  medicationRequest.statusReason = {
    coding: [
      {
        system:
          "https://fhir.nhs.uk/CodeSystem/medicationrequest-status-reason",
        code: cancellationReason.id,
        display: cancellationReason.display
      }
    ]
  }
  // remove all old medication requests but keep other modified resources
  bundle.entry = bundle.entry.filter(e => e.resource.resourceType !== "MedicationRequest")
  // add cancel medication request
  bundle.entry.push(clonedMedicationRequestEntry)

  const canceller = pageData.cancellers.filter(
    canceller => canceller.id === pageData.selectedCancellerId
  )[0]

  if (canceller.id !== "same-as-original-author") {
    const cancelPractitionerRoleIdentifier = uuid.v4()
    const cancelPractitionerIdentifier = uuid.v4()

    medicationRequest.extension.push({
      url:
        "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ResponsiblePractitioner",
      valueReference: {
        reference: `urn:uuid:${cancelPractitionerRoleIdentifier}`
      }
    })

    const practitionerRoleEntry = getPractitionerRoleBundleEntries(bundle.entry)[0]
    const cancelPractitionerRoleEntry = JSON.parse(
      JSON.stringify(practitionerRoleEntry)
    ) as BundleEntry

    cancelPractitionerRoleEntry.fullUrl = `urn:uuid:${cancelPractitionerRoleIdentifier}`
    const cancelPractitionerRole = cancelPractitionerRoleEntry.resource as PractitionerRole
    cancelPractitionerRole.practitioner = fhirCommon.createReference(`urn:uuid:${cancelPractitionerIdentifier}`)
    cancelPractitionerRole.identifier = [
      {
        system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
        value: canceller.sdsRoleProfileId
      }
    ]
    cancelPractitionerRole.code.forEach(code =>
      code.coding
        .filter(
          coding =>
            coding.system ===
            "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName"
        )
        .forEach(coding => {
          (coding.code = canceller.id), (coding.display = canceller.display)
        })
    )
    bundle.entry.push(cancelPractitionerRoleEntry)

    const practitionerEntry = getPractitionerBundleEntries(bundle.entry)[0]
    const cancelPractitionerEntry = JSON.parse(
      JSON.stringify(practitionerEntry)
    )
    cancelPractitionerEntry.fullUrl = `urn:uuid:${cancelPractitionerIdentifier}`
    const cancelPractitioner = cancelPractitionerEntry.resource
    cancelPractitioner.identifier = [
      {
        system: "https://fhir.nhs.uk/Id/sds-user-id",
        value: canceller.sdsUserId
      },
      {
        system: canceller.professionalCodeSystem,
        value: canceller.professionalCodeValue
      }
    ]
    cancelPractitioner.name = [
      {
        family: canceller.lastName,
        given: [canceller.firstName],
        prefix: [canceller.title]
      }
    ]
    bundle.entry.push(cancelPractitionerEntry)
  }

  return bundle
}
