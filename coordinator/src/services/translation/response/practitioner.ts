import {convertName, generateResourceId} from "./common"
import {fhir, hl7V3} from "@models"
import {createPractitionerOrRoleIdentifier} from "./identifiers"

export function createPractitioner(agentPerson: hl7V3.AgentPerson): fhir.Practitioner {
  return {
    resourceType: "Practitioner",
    id: generateResourceId(),
    identifier: [createPractitionerIdentifier(agentPerson.agentPerson.id)],
    name: convertName(agentPerson.agentPerson.name)
  }
}

export function createPractitionerIdentifier(
  userId: hl7V3.PrescriptionAuthorId | hl7V3.PrescriptionDispenseAuthorId
): fhir.Identifier {
  const identifier = createPractitionerOrRoleIdentifier(userId)
  if (identifier.system !== "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code") {
    return identifier
  }
  //TODO - if we don't enter the if statement we're going to emit an invalid message according to the IG
}
