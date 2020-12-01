import * as fhir from "../../../models/fhir/fhir-resources"
import {AgentPerson} from "../../../models/hl7-v3/hl7-v3-people-places"
import {convertTelecom} from "./common"
import {toArray} from "../common"

export function createPractitionerRole(
  agentPerson: AgentPerson,
  practitionerReference: string,
  practitionerCode: string,
  organizationReference: string,
): fhir.PractitionerRole {
  const practitionerRole = {resourceType: "PractitionerRole"} as fhir.PractitionerRole

  practitionerRole.identifier = [{
    system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
    value: agentPerson.id._attributes.extension
  }]

  practitionerRole.practitioner = getReference(practitionerReference)

  practitionerRole.organization = getReference(organizationReference)

  practitionerRole.code = getCode(practitionerCode)

  if (toArray(agentPerson.telecom)[0]._attributes) {
    practitionerRole.telecom = convertTelecom(agentPerson.telecom)
  }

  return practitionerRole
}

function getCode(practitionerCode: string) {
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

function getReference(referenceString: string) {
  return {reference: referenceString}
}
