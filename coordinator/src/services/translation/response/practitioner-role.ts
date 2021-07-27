import {convertTelecom, generateResourceId} from "./common"
import {toArray} from "../common"
import {fhir, hl7V3} from "@models"

export function createPractitionerRole(
  hl7AgentPerson: hl7V3.AgentPerson,
  practitionerId: string,
  healthcareServiceId: string
): fhir.PractitionerRole {
  return {
    resourceType: "PractitionerRole",
    id: generateResourceId(),
    identifier: createRoleProfileIdentifier(hl7AgentPerson),
    practitioner: fhir.createReference(practitionerId),
    healthcareService: [
      fhir.createReference(healthcareServiceId)
    ],
    code: createJobRoleNameCode(hl7AgentPerson.code._attributes.code),
    telecom: toArray(hl7AgentPerson.telecom)[0]?._attributes ? convertTelecom(hl7AgentPerson.telecom) : undefined
  }
}

function createRoleProfileIdentifier(hl7AgentPerson: hl7V3.AgentPerson) {
  return [fhir.createIdentifier("https://fhir.nhs.uk/Id/sds-role-profile-id", hl7AgentPerson.id._attributes.extension)]
}

function createJobRoleNameCode(practitionerCode: string) {
  return [{
    coding: [
      {
        system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
        code: practitionerCode,
        display: "Outpatient" //TODO required field, Kevin seeing if we can remove. RESOLUTION: Hardcoded for now.
      }
    ]
  }]
}
