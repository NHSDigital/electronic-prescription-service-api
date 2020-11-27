import * as fhir from "../../../models/fhir/fhir-resources"
import * as hl7 from "../../../models/hl7-v3/hl7-v3-people-places"
import {toArray} from "../common"
import {convertName} from "./common"

export function createPractitioner(hl7AgentPerson: hl7.AgentPerson): fhir.Practitioner  {
  const fhirPractitioner = {resourceType: "Practitioner"} as fhir.Practitioner

  const hl7RoleId = hl7AgentPerson.id._attributes.extension
  const hl7PersonId = hl7AgentPerson.agentPerson.id._attributes.extension
  const hl7PersonOId = hl7AgentPerson.agentPerson.id._attributes.root
  fhirPractitioner.identifier = getIdentifier(hl7RoleId, hl7PersonId, hl7PersonOId)

  const hl7Name = toArray(hl7AgentPerson.agentPerson.name)
  fhirPractitioner.name = convertName(hl7Name)

  return fhirPractitioner
}

function getIdentifier(roleId: string, personId: string, personOId: string) {
  return [
    {
      "system": "https://fhir.nhs.uk/Id/sds-user-id",
      "value": roleId
    },
    {
      "system": convertCodeSystem(personOId),
      "value": personId
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
