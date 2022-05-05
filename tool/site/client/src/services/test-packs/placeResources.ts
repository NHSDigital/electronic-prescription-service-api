import * as fhir from "fhir/r4"
import {OdsOrganization, PrescriptionType} from "."
import {PrescriptionRow} from "./xls"

export function createPlaceResources(
  prescriptionType: PrescriptionType,
  prescriptionRows: Array<PrescriptionRow>,
  organisation: OdsOrganization,
  fhirPrescription: fhir.Bundle
): void {
  if (prescriptionType.startsWith("prescribing-cost-centre")) {
    fhirPrescription.entry.push({
      fullUrl: "urn:uuid:3b4b03a5-52ba-4ba6-9b82-70350aa109d8",
      resource: {
        resourceType: "Organization",
        identifier: [
          {
            system: "https://fhir.nhs.uk/Id/ods-organization-code",
            value: prescriptionRows[0].organisation
          }
        ],
        type: [
          {
            coding: [
              {
                system: "https://fhir.nhs.uk/CodeSystem/organisation-role",
                code: "76",
                display: "GP PRACTICE"
              }
            ]
          }
        ],
        name: organisation.name,
        address: [organisation.address],
        telecom: organisation.telecom,
        partOf: {
          identifier: {
            system: "https://fhir.nhs.uk/Id/ods-organization-code",
            value: "84H"
          },
          display: "NHS COUNTY DURHAM CCG"
        }
      } as fhir.Organization
    })
  } else if (prescriptionType === "trust-site-code") {
    fhirPrescription.entry.push({
      fullUrl: "urn:uuid:3b4b03a5-52ba-4ba6-9b82-70350aa109d8",
      resource: {
        resourceType: "Organization",
        id: "3b4b03a5-52ba-4ba6-9b82-70350aa109d8",
        identifier: [
          {
            system: "https://fhir.nhs.uk/Id/ods-organization-code",
            value: "RBA"
          }
        ],
        type: [
          {
            coding: [
              {
                system: "https://fhir.nhs.uk/CodeSystem/organisation-role",
                code: "197",
                display: "NHS TRUST"
              }
            ]
          }
        ],
        name: "TAUNTON AND SOMERSET NHS FOUNDATION TRUST",
        address: [
          {
            line: ["MUSGROVE PARK HOSPITAL", "PARKFIELD DRIVE", "TAUNTON"],
            postalCode: "TA1 5DA"
          }
        ],
        telecom: [
          {
            system: "phone",
            value: "01823333444",
            use: "work"
          }
        ]
      } as fhir.Organization
    })
    fhirPrescription.entry.push({
      fullUrl: "urn:uuid:54b0506d-49af-4245-9d40-d7d64902055e",
      resource: {
        resourceType: "HealthcareService",
        id: "54b0506d-49af-4245-9d40-d7d64902055e",
        identifier: [
          {
            use: "usual",
            system: "https://fhir.nhs.uk/Id/ods-organization-code",
            value: prescriptionRows[0].organisation
          }
        ],
        active: true,
        providedBy: {
          identifier: {
            system: "https://fhir.nhs.uk/Id/ods-organization-code",
            value: "RBA"
          }
        },
        location: [
          {
            reference: "urn:uuid:8a5d7d67-64fb-44ec-9802-2dc214bb3dcb"
          }
        ],
        name: organisation.name,
        telecom: organisation.telecom
      } as fhir.HealthcareService
    })
    fhirPrescription.entry.push({
      fullUrl: "urn:uuid:8a5d7d67-64fb-44ec-9802-2dc214bb3dcb",
      resource: {
        resourceType: "Location",
        id: "8a5d7d67-64fb-44ec-9802-2dc214bb3dcb",
        identifier: [
          {
            value: "10008800708"
          }
        ],
        status: "active",
        mode: "instance",
        address: organisation.address
      } as fhir.Location
    })
  }
}
