import * as fhir from "../../../models/fhir/fhir-resources"
import * as hl7 from "../../../models/hl7-v3/hl7-v3-people-places"
import {convertName} from "./common"
import {InvalidValueError} from "../../../models/errors/processing-errors"
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
  return [
    {
      "system": convertCodeSystem(personId),
      "value": personId
    }
  ]
}

function convertCodeSystem(codeValue: string): string {
  if (codeValue.startsWith("G6") || codeValue.startsWith("G7")) {
    return "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code"
  } else if (codeValue.startsWith("G")) {
    return "https://fhir.hl7.org.uk/Id/gmp-number"
  } else if (codeValue.startsWith("C")) {
    return "https://fhir.hl7.org.uk/Id/gmc-number"
  } else if (codeValue.length === 6 && !isNaN(Number(codeValue))) {
    return "https://fhir.hl7.org.uk/Id/din-number"
  } else if (codeValue.length === 7 && !isNaN(Number(codeValue))) {
    return "https://fhir.hl7.org.uk/Id/gphc-number"
  }
  //NMC
  // 6 digits DIN
  // 6 digits starting with 6 call spurious code
  // 8 characters, starting with G - remove G and drop last character, call DIN
  throw new InvalidValueError(`unrecognised prescriber code ${codeValue}`)
}
