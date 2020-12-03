import * as fhir from "../../../models/fhir/fhir-resources"
import * as hl7 from "../../../models/hl7-v3/hl7-v3-people-places"
import {convertName} from "./common"
import {InvalidValueError} from "../../../models/errors/processing-errors"

export function createPractitioner(hl7AgentPerson: hl7.AgentPerson): fhir.Practitioner  {
  const fhirPractitioner = {resourceType: "Practitioner"} as fhir.Practitioner

  const hl7PersonId = hl7AgentPerson.agentPerson.id._attributes.extension
  fhirPractitioner.identifier = getIdentifier(hl7PersonId)

  fhirPractitioner.name = convertName(hl7AgentPerson.agentPerson.name)

  return fhirPractitioner
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
  throw new InvalidValueError(`unrecognised prescriber code ${codeValue}`)
}
