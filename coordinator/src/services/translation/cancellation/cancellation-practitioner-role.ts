import * as fhir from "../../../models/fhir/fhir-resources"
import {AgentPerson} from "../../../models/hl7-v3/hl7-v3-people-places"
import {convertTelecom, getFullUrl} from "./common"
import {toArray} from "../common"
import * as uuid from "uuid"

function createRoleProfileIdentifier(hl7AgentPerson: AgentPerson) {
  return [{
    system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
    value: hl7AgentPerson.id._attributes.extension
  }]
}

export function createPractitionerRole(
  hl7AgentPerson: AgentPerson,
  practitionerReference: string,
  organizationReference: string,
): fhir.PractitionerRole {
  return {
    resourceType: "PractitionerRole",
    id: uuid.v4.toString().toLowerCase(),
    identifier: createRoleProfileIdentifier(hl7AgentPerson),
    practitioner: createReference(practitionerReference),
    organization: createReference(organizationReference),
    code: createJobRoleNameCode(hl7AgentPerson.code._attributes.code),
    telecom: toArray(hl7AgentPerson.telecom)[0]._attributes ? convertTelecom(hl7AgentPerson.telecom) : undefined
  }
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
  return {reference: getFullUrl(referenceString)}
}
