import {fhir} from "@models"

export const groupIdentifierParameter: fhir.IdentifierParameter = {
  name: "group-identifier",
  valueIdentifier: {
    system: "https://fhir.nhs.uk/Id/prescription-order-number",
    value: "18B064-A99968-4BCAA3"
  }
}