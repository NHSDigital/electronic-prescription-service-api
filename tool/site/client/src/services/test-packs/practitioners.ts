import * as fhir from "fhir/r4"
import {PrescriptionRow, XlsRow} from "./xls"

export function getPractitioner(prescribers: Array<fhir.BundleEntry>, prescriptionRow: PrescriptionRow): fhir.BundleEntry {
  if (!prescribers.length) {
    return DEFAULT_PRACTITIONER_BUNDLE_ENTRY
  }

  const testNumber = parseInt(prescriptionRow.testId)
  return prescribers[testNumber - 1]
}

export function createPractitioners(rows: Array<XlsRow>): Array<fhir.BundleEntry> {
  return rows.map(row => {
    const professionalCode = row["Professional Code"].toString()
    const professionalCodeType = row["Professional Code Type"]
    const prescribingCode = row["Prescribing Code"]?.toString()
    const prescribingCodeType = row["Prescribing Code Type"]?.toString()

    const practitionerIdentifier = [
      {
        system: "https://fhir.nhs.uk/Id/sds-user-id",
        value: "7020134158"
      }
    ]

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
      case "Unknown":
        professionalCodeSystem = "https://fhir.hl7.org.uk/Id/professional-code"
        break
      default:
        throw new Error(`Professional Code Type has invalid value: '${professionalCodeType}'`)
    }

    practitionerIdentifier.push({
      system: professionalCodeSystem,
      value: professionalCode
    })

    switch (prescribingCodeType) {
      case "DIN":
        practitionerIdentifier.push({
          system: "https://fhir.hl7.org.uk/Id/din-number",
          value: prescribingCode
        })
        break
    }

    return {
      fullUrl: "urn:uuid:a8c85454-f8cb-498d-9629-78e2cb5fa47a",
      resource: {
        resourceType: "Practitioner",
        id: "a8c85454-f8cb-498d-9629-78e2cb5fa47a",
        identifier: practitionerIdentifier,
        name: [
          {
            text: row["Prescriber Name"]
          }
        ]
      } as fhir.Practitioner
    }
  })
}

const DEFAULT_PRACTITIONER_BUNDLE_ENTRY = {
  fullUrl: "urn:uuid:a8c85454-f8cb-498d-9629-78e2cb5fa47a",
  resource: {
    resourceType: "Practitioner",
    id: "a8c85454-f8cb-498d-9629-78e2cb5fa47a",
    identifier: [
      {
        system: "https://fhir.nhs.uk/Id/sds-user-id",
        value: "7020134158"
      },
      {
        system: "https://fhir.hl7.org.uk/Id/gmc-number",
        value: "C1234567"
      },
      {
        system: "https://fhir.hl7.org.uk/Id/din-number",
        value: "70201123456"
      }
    ],
    name: [
      {
        family: "Edwards",
        given: ["Thomas"],
        prefix: ["DR"]
      }
    ]
  } as fhir.Practitioner
}
