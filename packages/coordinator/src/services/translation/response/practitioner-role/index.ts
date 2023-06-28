import {convertTelecom, generateResourceId} from "../common"
import {toArray} from "../../common"
import {fhir, hl7V3} from "@models"
import {createPractitionerOrRoleIdentifier} from "../identifiers"
import roleNames from "./role-names.json"
import {SdsJobRoleCode} from "../../../../../../models/hl7-v3"

export function createPractitionerRole(
  hl7AgentPerson: hl7V3.AgentPerson,
  practitionerId: string
): fhir.PractitionerRole {
  return {
    resourceType: "PractitionerRole",
    id: generateResourceId(),
    identifier: createPractitionerRoleIdentifiers(hl7AgentPerson),
    practitioner: fhir.createReference(practitionerId),
    code: createJobRoleNameCode(hl7AgentPerson.code),
    telecom: toArray(hl7AgentPerson.telecom)[0]?._attributes ? convertTelecom(hl7AgentPerson.telecom) : undefined
  }
}

function createPractitionerRoleIdentifiers(hl7AgentPerson: hl7V3.AgentPerson) {
  const identifiers: Array<fhir.Identifier> = []
  if (hl7AgentPerson.id) {
    const roleId = hl7AgentPerson.id._attributes.extension
    identifiers.push(fhir.createIdentifier("https://fhir.nhs.uk/Id/sds-role-profile-id", roleId))
  }

  const userId = hl7AgentPerson.agentPerson.id._attributes.extension
  const extraIdentifier = createPractitionerOrRoleIdentifier(userId)
  if (extraIdentifier.system === "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code") {
    identifiers.push(extraIdentifier)
  }

  if (identifiers.length === 0) {
    return null
  }

  return identifiers
}

function createJobRoleNameCode(sdsJobRoleCode: SdsJobRoleCode) {
  if (!sdsJobRoleCode) {
    return null
  }

  const jobRoleCode = sdsJobRoleCode._attributes.code
  const isJobRoleName = !jobRoleCode.includes(":")
  const jobNameCode = jobRoleCode.split(":").pop()

  const system = isJobRoleName
    ? "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName"
    : "https://fhir.nhs.uk/CodeSystem/NHSDigital-SDS-JobRoleCode"

  return [
    {
      coding: [
        {
          system: system,
          code: jobRoleCode,
          display: getDisplayName(jobNameCode)
        }
      ]
    }
  ]
}

function getDisplayName(jobRoleCode: string): string {
  return roleNames.find(({code}) => code === jobRoleCode)?.display
}
