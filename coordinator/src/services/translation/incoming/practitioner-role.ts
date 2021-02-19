import * as fhir from "../../../models/fhir/fhir-resources"
import {AgentPerson} from "../../../models/hl7-v3/hl7-v3-people-places"
import {convertTelecom, generateResourceId} from "./common"
import {toArray} from "../common"
import {createIdentifier, createReference} from "./fhir-base-types"

export function createPractitionerRole(
  hl7AgentPerson: AgentPerson,
  practitionerId: string,
  healthcareServiceId: string
): fhir.PractitionerRole {
  return {
    resourceType: "PractitionerRole",
    id: generateResourceId(),
    identifier: createRoleProfileIdentifier(hl7AgentPerson),
    practitioner: createReference(practitionerId),
    healthcareService: [
      createReference(healthcareServiceId)
    ],
    code: createJobRoleNameCode(hl7AgentPerson.code._attributes.code),
    telecom: toArray(hl7AgentPerson.telecom)[0]?._attributes ? convertTelecom(hl7AgentPerson.telecom) : undefined
  }
}

function createRoleProfileIdentifier(hl7AgentPerson: AgentPerson) {
  return [createIdentifier("https://fhir.nhs.uk/Id/sds-role-profile-id", hl7AgentPerson.id._attributes.extension)]
}

function createJobRoleNameCode(practitionerCode: string) {
  return [{
    coding: [
      {
        system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
        code: practitionerCode,
        display: "" //TODO required field, Kevin seeing if we can remove
      }
    ]
  }]
}
