import * as fhir from "../../../models/fhir/fhir-resources"
import * as hl7 from "../../../models/hl7-v3/hl7-v3-people-places"
import {convertName, generateResourceId} from "./common"
import {createIdentifier} from "./fhir-base-types"

export function createPractitioner(hl7AgentPerson: hl7.AgentPerson): fhir.Practitioner {
  return {
    resourceType: "Practitioner",
    id: generateResourceId(),
    identifier: getIdentifier(hl7AgentPerson.agentPerson.id._attributes.extension),
    name: convertName(hl7AgentPerson.agentPerson.name)
  }
}

function getIdentifier(personId: string) {
  let formattedPersonId = personId.toUpperCase()
  if (formattedPersonId.match(/^G\d{7}$/)) {
    formattedPersonId = formattedPersonId.substring(1,7)
  }
  return [createIdentifier(getSystemForCode(formattedPersonId), formattedPersonId)]
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
