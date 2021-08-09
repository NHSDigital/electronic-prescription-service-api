import {convertName, generateResourceId} from "./common"
import {fhir, hl7V3} from "@models"
import {createPractitionerOrRoleIdentifier} from "./identifiers"

export function createPractitioner(agentPerson: hl7V3.AgentPerson): fhir.Practitioner {
  return {
    resourceType: "Practitioner",
    id: generateResourceId(),
    identifier: createPractitionerIdentifiers(agentPerson.agentPerson.id._attributes.extension),
    name: convertName(agentPerson.agentPerson.name)
  }
}

function createPractitionerIdentifiers(userId: string) {
  const identifier = createPractitionerOrRoleIdentifier(userId)
  if (identifier.system === "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code") {
    //TODO - if we hit this we're going to emit an invalid message according to the IG
    return []
  }
  return [identifier]
}
