import * as fhir from "@models/fhir"
import {getExtensionForUrl, onlyElement} from "../translation/common"

export type OdsOrganizationRoleExtension = fhir.ExtensionExtension<fhir.CodingExtension | fhir.BooleanExtension
  | fhir.StringExtension>

export interface OdsOrganization extends fhir.Resource {
  resourceType: "Organization"
  extension: Array<OdsOrganizationRoleExtension>
  identifier: fhir.Identifier
  name?: string
  telecom?: Array<fhir.ContactPoint>
  address?: fhir.Address
}

export function convertToOrganization(odsOrganization: OdsOrganization): fhir.Organization {
  const organizationPrimaryRole = getOrganizationPrimaryRole(odsOrganization.extension)
  return {
    resourceType: "Organization",
    identifier: [odsOrganization.identifier],
    type: [{
      coding: [{
        system: "https://fhir.nhs.uk/CodeSystem/organisation-role",
        code: organizationPrimaryRole.code,
        display: organizationPrimaryRole.display
      }]
    }],
    name: odsOrganization.name,
    telecom: odsOrganization.telecom,
    address: odsOrganization.address ? [odsOrganization.address] : undefined
  }
}

function getOrganizationPrimaryRole(extensions: Array<OdsOrganizationRoleExtension>) {
  const organizationRoleExtensions = extensions.filter(extension =>
    extension.url === "https://fhir.nhs.uk/STU3/StructureDefinition/Extension-ODSAPI-OrganizationRole-1"
  )
  const primaryOrganizationRoleExtensions = organizationRoleExtensions.filter(getPrimaryRoleExtensionValue)
  const activePrimaryOrganizationRoleExtensions = primaryOrganizationRoleExtensions.filter(extension =>
    getStatusExtensionValue(extension) === "Active"
  )
  const singleActivePrimaryOrganizationRoleExtension = onlyElement(
    activePrimaryOrganizationRoleExtensions,
    "Organization.extension(https://fhir.nhs.uk/STU3/StructureDefinition/Extension-ODSAPI-OrganizationRole-1)",
    "primary role and active"
  )
  return getRoleExtensionValue(singleActivePrimaryOrganizationRoleExtension)
}

function getPrimaryRoleExtensionValue(extension: OdsOrganizationRoleExtension) {
  const primaryRoleExtension = getExtensionForUrl(
    extension.extension,
    "primaryRole",
    // eslint-disable-next-line max-len
    "Organization.extension(https://fhir.nhs.uk/STU3/StructureDefinition/Extension-ODSAPI-OrganizationRole-1).extension"
  ) as fhir.BooleanExtension
  return primaryRoleExtension.valueBoolean
}

function getStatusExtensionValue(extension: OdsOrganizationRoleExtension) {
  const statusExtension = getExtensionForUrl(
    extension.extension,
    "status",
    // eslint-disable-next-line max-len
    "Organization.extension(https://fhir.nhs.uk/STU3/StructureDefinition/Extension-ODSAPI-OrganizationRole-1).extension"
  ) as fhir.StringExtension
  return statusExtension.valueString
}

function getRoleExtensionValue(extension: OdsOrganizationRoleExtension) {
  const organizationRoleExtensionRoleExtension = getExtensionForUrl(
    extension.extension,
    "role",
    // eslint-disable-next-line max-len
    "Organization.extension(https://fhir.nhs.uk/STU3/StructureDefinition/Extension-ODSAPI-OrganizationRole-1).extension"
  ) as fhir.CodingExtension
  return organizationRoleExtensionRoleExtension.valueCoding
}
