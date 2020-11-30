import {CancellationResponse} from "../../../models/hl7-v3/hl7-v3-spine-response"
import * as fhir from "../../../models/fhir/fhir-resources"

export function createPractitionerRole(
  cancellationResponse: CancellationResponse,
  practitionerReference: string,
  practitionerCode: string,
  organizationReference: string
): fhir.PractitionerRole {
  const practitionerRole = {resourceType: "PractitionerRole"} as fhir.PractitionerRole

  // practitionerRole.identifier = []

  practitionerRole.practitioner = getReference(practitionerReference)

  practitionerRole.organization = getReference(organizationReference)

  practitionerRole.code = getCode(practitionerCode)

  // practitionerRole.telecom = []

  return practitionerRole
}

function getCode(practitionerCode: string) {
  return [
    {
      coding: [
        {
          system: "https://fhir.nhs.uk/R4/CodeSystem/UKCore-SDSJobRoleName",
          code: practitionerCode,
          display: "" //TODO ask Kevin about the display values, need a map?
        }
      ]
    }]
}

function getReference(referenceString: string) {
  return {reference: referenceString}
}
