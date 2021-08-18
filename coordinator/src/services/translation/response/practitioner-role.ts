import {convertName, convertTelecom, generateResourceId, joinArrayWithSpaces} from "./common"
import {toArray} from "../common"
import {fhir, hl7V3} from "@models"
import {createPractitionerOrRoleIdentifier} from "./identifiers"
import {createPractitionerIdentifier} from "./practitioner"
import {getOrganizationCodeIdentifier} from "./organization"

export function createPractitionerRole(
  hl7AgentPerson: hl7V3.AgentPerson,
  practitionerId: string,
  healthcareServiceId: string
): fhir.PractitionerRole {
  return {
    resourceType: "PractitionerRole",
    id: generateResourceId(),
    identifier: createPractitionerRoleIdentifiers(hl7AgentPerson),
    practitioner: fhir.createReference(practitionerId),
    healthcareService: [
      fhir.createReference(healthcareServiceId)
    ],
    code: createJobRoleNameCode(hl7AgentPerson.code._attributes.code),
    telecom: toArray(hl7AgentPerson.telecom)[0]?._attributes ? convertTelecom(hl7AgentPerson.telecom) : undefined
  }
}

export function createRefactoredPractitionerRole(
  hl7AgentPerson: hl7V3.AgentPerson
): fhir.PractitionerRole {
  const organization = hl7AgentPerson.representedOrganization
  const practitionerName = joinArrayWithSpaces(convertName(hl7AgentPerson.agentPerson.name))
  const practitionerIdentifier = createPractitionerIdentifier(hl7AgentPerson.agentPerson.id._attributes.extension)
  const healthcareServiceIdentifier = getOrganizationCodeIdentifier(organization.id._attributes.extension)
  const healthcareServiceName = organization.name._text

  return {
    resourceType: "PractitionerRole",
    id: generateResourceId(),
    identifier: createPractitionerRoleIdentifiers(hl7AgentPerson),
    practitioner: fhir.createIdentifierReference(practitionerIdentifier, practitionerName),
    healthcareService: [
      fhir.createIdentifierReference(healthcareServiceIdentifier, healthcareServiceName)
    ],
    code: createJobRoleNameCode(hl7AgentPerson.code._attributes.code),
    telecom: toArray(hl7AgentPerson.telecom)[0]?._attributes ? convertTelecom(hl7AgentPerson.telecom) : undefined
  }
}

function createPractitionerRoleIdentifiers(hl7AgentPerson: hl7V3.AgentPerson) {
  const roleId = hl7AgentPerson.id._attributes.extension
  const identifiers = [
    fhir.createIdentifier("https://fhir.nhs.uk/Id/sds-role-profile-id", roleId)
  ]

  const userId = hl7AgentPerson.agentPerson.id._attributes.extension
  const extraIdentifier = createPractitionerOrRoleIdentifier(userId)
  if (extraIdentifier.system === "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code") {
    identifiers.push(extraIdentifier)
  }

  return identifiers
}

function createJobRoleNameCode(practitionerCode: string) {
  return [{
    coding: [{
      system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
      code: practitionerCode,
      //TODO - remove once profile has been relaxed
      display: practitionerCode
    }]
  }]
}
