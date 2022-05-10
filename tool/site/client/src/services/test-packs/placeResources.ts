import * as fhir from "fhir/r4"
import {PrescriptionType} from "."
import {OrganisationRow, ParentOrganisationRow} from "./xls"

export function createPlaceResources(
  prescriptionType: PrescriptionType,
  organisations: Array<OrganisationRow>,
  parentOrganisations: Array<ParentOrganisationRow>
): Array<fhir.BundleEntry> {

  // todo: handle more than 1 org/parent org per test pack
  const organisation = organisations[0]
  const parentOrganisation = parentOrganisations[0]

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
        address: organisation.address,
        telecom: [
          {
            system: "phone",
            value: parentOrganisation.telecom,
            use: "work"
          }
        ],
        partOf: {
          identifier: {
            system: "https://fhir.nhs.uk/Id/ods-organization-code",
            value: parentOrganisation.odsCode
          },
          display: parentOrganisation.name
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
            value: parentOrganisation.odsCode
          }
        ],
        active: true,
        providedBy: {
          identifier: {
            system: "https://fhir.nhs.uk/Id/ods-organization-code",
            value: parentOrganisation.odsCode
          }
        },
        location: [
          {
            reference: "urn:uuid:8a5d7d67-64fb-44ec-9802-2dc214bb3dcb"
          }
        ],
        name: parentOrganisation.name,
        telecom: [
          {
            system: "phone",
            value: parentOrganisation.telecom,
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
        address: parentOrganisation.address
      } as fhir.Location
    }]
  }
}
