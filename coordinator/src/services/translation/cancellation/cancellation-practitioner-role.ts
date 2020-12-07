import * as fhir from "../../../models/fhir/fhir-resources"
import {AgentPerson} from "../../../models/hl7-v3/hl7-v3-people-places"
import {convertTelecom} from "./common"
import {toArray} from "../common"

export function createPractitionerRole(
  hl7AgentPerson: AgentPerson,
  practitionerReference: string,
  organizationReference: string,
): fhir.PractitionerRole {
  const practitionerRole = {resourceType: "PractitionerRole"} as fhir.PractitionerRole

  practitionerRole.identifier = [{
    system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
    value: hl7AgentPerson.id._attributes.extension
  }]

  practitionerRole.practitioner = createReference(practitionerReference)

  practitionerRole.organization = createReference(organizationReference)

  practitionerRole.code = createJobRoleNameCode(hl7AgentPerson.code._attributes.code)

  if (toArray(hl7AgentPerson.telecom)[0]._attributes) {
    practitionerRole.telecom = convertTelecom(hl7AgentPerson.telecom)
  }

  return practitionerRole
}

function createJobRoleNameCode(practitionerCode: string) {
  return [{
    coding: [
      {
        system: "https://fhir.nhs.uk/R4/CodeSystem/UKCore-SDSJobRoleName",
        code: practitionerCode,
        display: "" //TODO required field, Kevin seeing if we can remove
      }
    ]
  }]
}

function createReference(referenceString: string) {
  return {reference: referenceString}
}
