import {convertName, generateResourceId} from "./common"
import {fhir, hl7V3} from "@models"
import {createPractitionerOrRoleIdentifier} from "./identifiers"

export function createPractitioner(agentPerson: hl7V3.AgentPerson): fhir.Practitioner {
  const identifier = createPractitionerIdentifier(agentPerson.agentPerson.id._attributes.extension)
  const practitioner: fhir.Practitioner = {
    resourceType: "Practitioner",
    id: generateResourceId(),
    name: convertName(agentPerson.agentPerson.name)
  }
  if (identifier) {
    practitioner.identifier = identifier
  }
  return practitioner
}

export function createPractitionerIdentifier(userId: string): Array<fhir.Identifier> | undefined {
  const identifier = createPractitionerOrRoleIdentifier(userId)
  if (identifier.system !== "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code") {
    return [identifier]
  }
  return undefined
}
