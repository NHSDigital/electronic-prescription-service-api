import * as fhir from "fhir/r4"
import {OrganisationRow, AccountRow} from "./xls"

export function createPlaceResources(
  organisation: OrganisationRow,
  account: AccountRow
): Array<fhir.BundleEntry> {
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
    } satisfies fhir.Organization
  }]
}
