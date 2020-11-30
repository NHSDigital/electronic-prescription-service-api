import {CancellationResponse} from "../../../models/hl7-v3/hl7-v3-spine-response"
import * as fhir from "../../../models/fhir/fhir-resources"

export function createPractitionerRole(
  cancellationResponse: CancellationResponse,
  practitionerReference: string,
  practitionerCode: string,
  organizationReference: string,
  organizationTelecom: Array<fhir.ContactPoint>
): fhir.PractitionerRole {
  const practitionerRole = {resourceType: "PractitionerRole"} as fhir.PractitionerRole

  practitionerRole.identifier = [{
    system: "https://fhir.nhs.uk/Id/sds-role-profile-id"
    //TODO where does this value come from? AgentPerson.id.extension
    // value: ""
  }]

  practitionerRole.practitioner = getReference(practitionerReference)

  practitionerRole.organization = getReference(organizationReference)

  practitionerRole.code = getCode(practitionerCode)

  //TODO just used the organization telecom here, is this right?
  // practitionerRole.telecom = [] AgentPerson.telecom
  practitionerRole.telecom = organizationTelecom

  return practitionerRole
}

function getCode(practitionerCode: string) {
  return [{
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
