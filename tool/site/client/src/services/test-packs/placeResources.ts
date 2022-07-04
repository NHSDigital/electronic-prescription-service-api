import * as fhir from "fhir/r4"
import {getPrescriptionType} from "."
import {OrganisationRow, AccountRow, PrescriptionRow} from "./xls"

export function createPlaceResources(
  prescriptionRows: Array<PrescriptionRow>,
  organisation: OrganisationRow,
  account: AccountRow
): Array<fhir.BundleEntry> {
  const prescriptionType = getPrescriptionType(
    prescriptionRows.find(prescription => prescription.testId === organisation.testId).prescriptionTypeCode
  )

  if (prescriptionType.startsWith("prescribing-cost-centre")) {
    return [{
      fullUrl: "urn:uuid:3b4b03a5-52ba-4ba6-9b82-70350aa109d8",
      resource: {
        resourceType: "Organization",
        identifier: [
          {
            system: "https://fhir.nhs.uk/Id/ods-organization-code",
            value: organisation.odsCode
          }
        ],
        type: [
          {
            coding: [
              {
                system: "https://fhir.nhs.uk/CodeSystem/organisation-role",
                code: organisation.roleCode,
                display: organisation.roleName
              }
            ]
          }
        ],
        name: organisation.name,
        address: [
          {
            use: "work",
            type: "both",
            line: organisation.address,
            city: organisation.city,
            district: organisation.district,
            postalCode: organisation.postcode
          }
        ],
        telecom: [
          {
            system: "phone",
            value: account.telecom,
            use: "work"
          }
        ],
        partOf: {
          identifier: {
            system: "https://fhir.nhs.uk/Id/ods-organization-code",
            value: account.odsCode
          },
          display: account.name
        }
      } as fhir.Organization
    }]
  } else if (prescriptionType === "trust-site-code") {
    return [{
      fullUrl: "urn:uuid:3b4b03a5-52ba-4ba6-9b82-70350aa109d8",
      resource: {
        resourceType: "Organization",
        id: "3b4b03a5-52ba-4ba6-9b82-70350aa109d8",
        identifier: [
          {
            system: "https://fhir.nhs.uk/Id/ods-organization-code",
            value: organisation.odsCode
          }
        ],
        type: [
          {
            coding: [
              {
                system: "https://fhir.nhs.uk/CodeSystem/organisation-role",
                code: organisation.roleCode,
                display: organisation.roleName
              }
            ]
          }
        ],
        name: organisation.name,
        address: [
          {
            line: organisation.address,
            postalCode: organisation.postcode
          }
        ],
        telecom: [
          {
            system: "phone",
            value: organisation.telecom,
            use: "work"
          }
        ]
      } as fhir.Organization
    },
    {
      fullUrl: "urn:uuid:54b0506d-49af-4245-9d40-d7d64902055e",
      resource: {
        resourceType: "HealthcareService",
        id: "54b0506d-49af-4245-9d40-d7d64902055e",
        identifier: [
          {
            use: "usual",
            system: "https://fhir.nhs.uk/Id/ods-organization-code",
            value: account.odsCode
          }
        ],
        active: true,
        providedBy: {
          identifier: {
            system: "https://fhir.nhs.uk/Id/ods-organization-code",
            value: account.odsCode
          }
        },
        location: [
          {
            reference: "urn:uuid:8a5d7d67-64fb-44ec-9802-2dc214bb3dcb"
          }
        ],
        name: account.name,
        telecom: [
          {
            system: "phone",
            value: account.telecom,
            use: "work"
          }
        ]
      } as fhir.HealthcareService
    },
    {
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
        address: {
          use: "work",
          line: account.address,
          city: account.city,
          postalCode: account.postcode
        }
      } as fhir.Location
    }]
  }
}
