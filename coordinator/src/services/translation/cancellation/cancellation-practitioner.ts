import * as fhir from "../../../models/fhir/fhir-resources"
import {AgentPerson} from "../../../models/hl7-v3/hl7-v3-people-places"
import {toArray} from "../common"

export function createPractitioner(agentPerson: AgentPerson): fhir.Practitioner  {
  const fhirPractitioner = {resourceType: "Practitioner"} as fhir.Practitioner

  fhirPractitioner.identifier = getIdentifier(agentPerson)

  fhirPractitioner.name = getName(agentPerson)

  return fhirPractitioner
}

function getIdentifier(agentPerson: AgentPerson) {
  return [
    {
      "system": "https://fhir.nhs.uk/Id/sds-user-id",
      "value": agentPerson.id._attributes.extension
    },
    {
      "system": convertCodeSystem(agentPerson.agentPerson.id._attributes.root),
      "value": agentPerson.agentPerson.id._attributes.extension
    }
  ]
}

function convertCodeSystem(codeSystem: string): string {
  //TODO figure out how to tell what type of code this is. Looks like a one to many mapping
  switch (codeSystem) {
  default:
    return "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code"
  }
}

function getName(agentPerson: AgentPerson) {
  return toArray(agentPerson.agentPerson.name).map(name => ({
    family: name.family._text,
    given: toArray(name.given).map(given => given._text),
    prefix: toArray(name.prefix).map(prefix => prefix._text)
  }))
}
