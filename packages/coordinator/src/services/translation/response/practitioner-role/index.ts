import {
  convertName,
  convertTelecom,
  generateResourceId,
  humanNameArrayToString
} from "../common"
import {toArray} from "../../common"
import {fhir, hl7V3} from "@models"
import {createPractitionerOrRoleIdentifier} from "../identifiers"
import {createPractitionerIdentifier} from "../practitioner"
import {getOrganizationCodeIdentifier} from "../organization"
import roleNames from "./role-names.json"

export function createPractitionerRole(
  hl7AgentPerson: hl7V3.AgentPerson,
  practitionerId: string
): fhir.PractitionerRole {
  return {
    resourceType: "PractitionerRole",
    id: generateResourceId(),
    identifier: createPractitionerRoleIdentifiers(hl7AgentPerson),
    practitioner: fhir.createReference(practitionerId),
    code: createJobRoleNameCode(hl7AgentPerson.code._attributes.code),
    telecom: toArray(hl7AgentPerson.telecom)[0]?._attributes ? convertTelecom(hl7AgentPerson.telecom) : undefined
  }
}

export function createRefactoredPractitionerRole(hl7AgentPerson: hl7V3.AgentPerson): fhir.PractitionerRole {
  const representedOrganization = hl7AgentPerson.representedOrganization

  const practitionerName = humanNameArrayToString(convertName(hl7AgentPerson.agentPerson.name))
  const practitionerIdentifier = createPractitionerIdentifier(hl7AgentPerson.agentPerson.id._attributes.extension)

  const healthcareServiceName = representedOrganization.name._text
  const healthcareServiceIdentifier = getOrganizationCodeIdentifier(representedOrganization.id._attributes.extension)

  const practitionerRole: fhir.PractitionerRole = {
    resourceType: "PractitionerRole",
    id: generateResourceId(),
    identifier: createPractitionerRoleIdentifiers(hl7AgentPerson),
    practitioner: fhir.createIdentifierReference(practitionerIdentifier, practitionerName),
    healthcareService: [fhir.createIdentifierReference(healthcareServiceIdentifier, healthcareServiceName)],
    code: createJobRoleNameCode(hl7AgentPerson.code._attributes.code),
    telecom: toArray(hl7AgentPerson.telecom)[0]?._attributes ? convertTelecom(hl7AgentPerson.telecom) : undefined
  }

  const healthCareProviderLicense = representedOrganization.healthCareProviderLicense
  if (healthCareProviderLicense) {
    const organization = healthCareProviderLicense.Organization

    const organizationName = organization.name?._text
    const organizationIdentifier = getOrganizationCodeIdentifier(organization.id._attributes.extension)

    practitionerRole.organization = fhir.createIdentifierReference(organizationIdentifier, organizationName)
  }

  return practitionerRole
}

function createPractitionerRoleIdentifiers(hl7AgentPerson: hl7V3.AgentPerson) {
  const roleId = hl7AgentPerson.id._attributes.extension
  const identifiers = [fhir.createIdentifier("https://fhir.nhs.uk/Id/sds-role-profile-id", roleId)]

  const userId = hl7AgentPerson.agentPerson.id._attributes.extension
  const extraIdentifier = createPractitionerOrRoleIdentifier(userId)
  if (extraIdentifier.system === "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code") {
    identifiers.push(extraIdentifier)
  }

  return identifiers
}

function createJobRoleNameCode(practitionerCode: string) {
  const jobRole = practitionerCode.includes(":") === true ? "Code" : "Name"
  const jobRoleCode = practitionerCode.split(":").pop()
  return [
    {
      coding: [
        {
          system: `https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRole${jobRole}`,
          code: practitionerCode,
          display: getDisplayName(jobRoleCode)
        }
      ]
    }
  ]
}

function getDisplayName(jobRoleCode: string): string {
  return roleNames.find(({code}) => code === jobRoleCode)?.display
}
