import * as fhir from "fhir/r4"
import {PrescriptionType} from "."
import {OrganisationRow, AccountRow} from "./xls"

export function createPlaceResources(
  prescriptionType: PrescriptionType,
  organisation: OrganisationRow,
  account: AccountRow
): Array<fhir.BundleEntry> {
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
  // flip these account <-> organisation
  } else if (prescriptionType === "trust-site-code") {
    return [{
      fullUrl: "urn:uuid:3b4b03a5-52ba-4ba6-9b82-70350aa109d8",
      resource: {
        resourceType: "Organization",
        id: "3b4b03a5-52ba-4ba6-9b82-70350aa109d8",
        identifier: [
          {
            system: "https://fhir.nhs.uk/Id/ods-organization-code",
            value: account.odsCode
          }
        ],
        type: [
          {
            coding: [
              {
                system: "https://fhir.nhs.uk/CodeSystem/organisation-role",
                code: account.roleCode,
                display: account.roleName
              }
            ]
          }
        ],
        name: account.name,
        address: [
          {
            line: account.address,
            postalCode: account.postcode
          }
        ],
        telecom: [
          {
            system: "phone",
            value: account.telecom,
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
            value: organisation.odsCode
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
        name: organisation.name,
        telecom: [
          {
            system: "phone",
            value: organisation.telecom,
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
          line: organisation.address,
          city: organisation.city,
          postalCode: organisation.postcode
        }
      } as fhir.Location
    }]
  }
}
