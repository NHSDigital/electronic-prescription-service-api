import * as fhir from "fhir/r4"
import {PrescriberRow} from "./xls"

export function createPractitioner(row: PrescriberRow): fhir.BundleEntry {
  const professionalCode = row.professionalCode
  const professionalCodeType = row.professionalCodeType
  const prescribingCode = row.prescribingCode
  const prescribingCodeType = row.prescribingCodeType

  let professionalCodeSystem = ""
  switch (professionalCodeType) {
    case "GMC":
      professionalCodeSystem = "https://fhir.hl7.org.uk/Id/gmc-number"
      break
    case "NMC":
      professionalCodeSystem = "https://fhir.hl7.org.uk/Id/nmc-number"
      break
    case "GPHC":
      professionalCodeSystem = "https://fhir.hl7.org.uk/Id/gphc-number"
      break
    case "GMP":
      professionalCodeSystem = "https://fhir.hl7.org.uk/Id/gmp-number"
      break
    case "HCPC":
      professionalCodeSystem = "https://fhir.hl7.org.uk/Id/hcpc-number"
      break
    default:
      professionalCodeSystem = "https://fhir.hl7.org.uk/Id/professional-code"
      break
  }

  const practitionerIdentifier = [
    {
      system: "https://fhir.nhs.uk/Id/sds-user-id",
      value: "7020134158"
    },
    {
      system: professionalCodeSystem,
      value: professionalCode
    }
  ]

  if (prescribingCodeType === "DIN") {
    practitionerIdentifier.push({
      system: "https://fhir.hl7.org.uk/Id/din-number",
      value: prescribingCode
    })
  }

  return {
    fullUrl: "urn:uuid:a8c85454-f8cb-498d-9629-78e2cb5fa47a",
    resource: {
      resourceType: "Practitioner",
      id: "a8c85454-f8cb-498d-9629-78e2cb5fa47a",
      identifier: practitionerIdentifier,
      name: [
        {
          text: row.prescriberName
        }
      ]
    } satisfies fhir.Practitioner
  }
}
