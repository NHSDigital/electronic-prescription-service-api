import * as fhir from "../../../models/fhir/fhir-resources"
import * as hl7 from "../../../models/hl7-v3/hl7-v3-people-places"
import {convertName} from "./common"
import * as uuid from "uuid"

export function createPractitioner(hl7AgentPerson: hl7.AgentPerson): fhir.Practitioner {
  return {
    resourceType: "Practitioner",
    id: uuid.v4.toString().toLowerCase(),
    identifier: getIdentifier(hl7AgentPerson.agentPerson.id._attributes.extension),
    name: convertName(hl7AgentPerson.agentPerson.name)
  }
}

function getIdentifier(personId: string) {
  let formattedPersonId = personId.toUpperCase()
  if (formattedPersonId.match(/^G\d{7}$/)) {
    formattedPersonId = formattedPersonId.substring(1,7)
  }
  return [
    {
      "system": getSystemForCode(formattedPersonId),
      "value": formattedPersonId
    }
  ]
}

function getSystemForCode(codeValue: string): string {
  const NURSE_PROFESSIONAL_CODE_REGEX = /\d{2}[A-Z]\d{4}[A-Z]/
  if (codeValue.length === 6 && codeValue.startsWith("6")) {
    return "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code"
  } else if (codeValue.length === 6) {
    return "https://fhir.hl7.org.uk/Id/din-number"
  } else if (codeValue.match(NURSE_PROFESSIONAL_CODE_REGEX)) {
    return "https://fhir.hl7.org.uk/Id/nmc-number"
  }
  return "https://fhir.hl7.org.uk/Id/professional-code"
}
