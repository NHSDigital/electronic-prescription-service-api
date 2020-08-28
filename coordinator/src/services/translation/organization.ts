import * as fhir from "../../model/fhir-resources"
import * as peoplePlaces from "../../model/hl7-v3-people-places"
import {
  getCodeableConceptCodingForSystemOrNull,
  getIdentifierValueForSystem,
  onlyElement,
  resolveReference
} from "./common"
import * as codes from "../../model/hl7-v3-datatypes-codes"
import * as core from "../../model/hl7-v3-datatypes-core"
import {convertAddress, convertTelecom} from "./demographics"
import {getHealthcareServices} from "./common/getResourcesOfType"

/**
 * TODO - This mapping is a temporary measure for testing. We're reasonably confident that it's correct for primary
 * care prescriptions, but we've not yet agreed where the two organizations should come from for secondary care
 * prescriptions.
 */

/**
 * TODO - possible bug, does current implementation depend on ordering of Organizations in FHIR message?
 */
export function convertOrganizationAndProviderLicense(
  fhirBundle: fhir.Bundle,
  fhirOrganization: fhir.Organization
): peoplePlaces.Organization {
  const hl7V3Organization = convertRepresentedOrganization(fhirOrganization, fhirBundle)

  hl7V3Organization.healthCareProviderLicense = convertHealthCareProviderLicense(fhirOrganization, fhirBundle)

  return hl7V3Organization
}

function convertRepresentedOrganization(fhirOrganization: fhir.Organization, fhirBundle: fhir.Bundle) {
  const organizationTypeCoding = getCodeableConceptCodingForSystemOrNull(fhirOrganization.type, "https://fhir.nhs.uk/R4/CodeSystem/organisation-role")
  const representedOrganization = (organizationTypeCoding?.code === "RO197") ? getHealthcareServices(fhirBundle)[0] : fhirOrganization
  return isOrganization(representedOrganization) ? convertOrganization(representedOrganization, false) : convertHealthcareService(representedOrganization)
}

function convertHealthCareProviderLicense(fhirOrganization: fhir.Organization, fhirBundle: fhir.Bundle) {
  const fhirParentOrganization = fhirOrganization.partOf ? resolveReference(fhirBundle, fhirOrganization.partOf) : fhirOrganization
  const hl7V3ParentOrganization = convertOrganization(fhirParentOrganization, true)
  return new peoplePlaces.HealthCareProviderLicense(hl7V3ParentOrganization)
}

function isOrganization(org: fhir.Organization | fhir.HealthcareService): org is fhir.Organization {
  return (org as fhir.Organization).resourceType === "Organization"
}

function convertOrganization(fhirOrganization: fhir.Organization, isHealthcareProviderLicense: boolean) {
  const hl7V3Organization = new peoplePlaces.Organization()
  hl7V3Organization.id = getOrganizationId(fhirOrganization)

  if (fhirOrganization.type !== undefined) {
    const organizationTypeCoding = getCodeableConceptCodingForSystemOrNull(fhirOrganization.type, "https://fhir.nhs.uk/R4/CodeSystem/organisation-type")
    hl7V3Organization.code = new codes.OrganizationTypeCode(organizationTypeCoding ? organizationTypeCoding.code : "008")
  }

  convertOrganizationName()

  if (!isHealthcareProviderLicense) {
    convertOrganizationTelecom()
    convertOrganizationAddress()
  }

  return hl7V3Organization

  function convertOrganizationTelecom() {
    if (fhirOrganization.telecom !== undefined) {
      hl7V3Organization.telecom = fhirOrganization.telecom.map(convertTelecom).reduce(onlyElement)
    }
  }

  function convertOrganizationAddress() {
    if (fhirOrganization.address !== undefined) {
      hl7V3Organization.addr = fhirOrganization.address.map(convertAddress).reduce(onlyElement)
    }
  }

  function convertOrganizationName() {
    if (fhirOrganization.name !== undefined) {
      hl7V3Organization.name = new core.Text(fhirOrganization.name)
    }
  }
}

function convertHealthcareService(fhirHealthcareService: fhir.HealthcareService) {
  const hl7V3Organization = new peoplePlaces.Organization()
  hl7V3Organization.id = getOrganizationId(fhirHealthcareService)

  hl7V3Organization.code = new codes.OrganizationTypeCode("999")

  convertHealthcareServiceName()
  convertHealthcareServiceTelecom()
  convertHealthcareServiceAddress()

  return hl7V3Organization

  function convertHealthcareServiceName() {
    if (fhirHealthcareService.name !== undefined) {
      hl7V3Organization.name = new core.Text(fhirHealthcareService.name)
    }
  }

  function convertHealthcareServiceTelecom() {
    if (fhirHealthcareService.telecom !== undefined) {
      hl7V3Organization.telecom = fhirHealthcareService.telecom.map(convertTelecom).reduce(onlyElement)
    }
  }

  function convertHealthcareServiceAddress() {
    console.log("") // fhirHealthcareService.Location, get Resource from reference and it has the address
  }
}

function getOrganizationId(fhirOrganization: fhir.Organization | fhir.HealthcareService) {
  const organizationSdsId = getIdentifierValueForSystem(fhirOrganization.identifier, "https://fhir.nhs.uk/Id/ods-organization-code")
  return new codes.SdsOrganizationIdentifier(organizationSdsId)
}
