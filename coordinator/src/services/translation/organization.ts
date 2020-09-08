import * as fhir from "../../model/fhir-resources"
import * as peoplePlaces from "../../model/hl7-v3-people-places"
import {
  getCodeableConceptCodingForSystemOrNull,
  getIdentifierValueForSystem, getResourceForFullUrl,
  onlyElement,
  resolveReference
} from "./common"
import * as codes from "../../model/hl7-v3-datatypes-codes"
import * as core from "../../model/hl7-v3-datatypes-core"
import {convertAddress, convertTelecom} from "./demographics"

const NHS_TRUST_CODE = "RO197"

/**
 * TODO - This mapping is a temporary measure for testing. We're reasonably confident that it's correct for primary
 * care prescriptions, but we've not yet agreed where the two organizations should come from for secondary care
 * prescriptions.
 * TODO - possible bug, does current implementation depend on ordering of Organizations in FHIR message?
 */
export function convertOrganizationAndProviderLicense(
  fhirBundle: fhir.Bundle,
  fhirOrganization: fhir.Organization,
  fhirHealthcareService: fhir.HealthcareService
): peoplePlaces.Organization {
  const hl7V3Organization = convertRepresentedOrganization(fhirOrganization, fhirHealthcareService, fhirBundle)

  hl7V3Organization.healthCareProviderLicense = convertHealthCareProviderLicense(fhirOrganization, fhirBundle)

  return hl7V3Organization
}

function convertRepresentedOrganization(fhirOrganization: fhir.Organization, fhirHealthcareService: fhir.HealthcareService, fhirBundle: fhir.Bundle) {
  const organizationTypeCoding = getCodeableConceptCodingForSystemOrNull(fhirOrganization.type, "https://fhir.nhs.uk/R4/CodeSystem/organisation-role")
  const representedOrganization = (organizationTypeCoding?.code === NHS_TRUST_CODE) ? new CostCentreHealthcareService(fhirHealthcareService, fhirBundle) : new CostCentreOrganization(fhirOrganization)
  return convertRepresentedOrganizationDetails(representedOrganization)
}

function convertHealthCareProviderLicense(fhirOrganization: fhir.Organization, fhirBundle: fhir.Bundle) {
  const fhirParentOrganization = new CostCentreOrganization(fhirOrganization.partOf ? resolveReference(fhirBundle, fhirOrganization.partOf) : fhirOrganization)
  return new peoplePlaces.HealthCareProviderLicense(convertHealthCareProviderLicenseDetails(fhirParentOrganization))
}

function convertRepresentedOrganizationDetails(costCentre: CostCentre): peoplePlaces.Organization {
  const result = convertHealthCareProviderLicenseDetails(costCentre)

  if (costCentre.telecom !== undefined) {
    result.telecom = costCentre.telecom.map(convertTelecom).reduce(onlyElement)
  }

  if (costCentre.address != undefined) {
    result.addr = costCentre.address.map(convertAddress).reduce(onlyElement)
  }

  return result
}

function convertHealthCareProviderLicenseDetails(costCentre: CostCentre): peoplePlaces.Organization {
  const result = new peoplePlaces.Organization()
  result.id = costCentre.getOrganizationId()

  result.code = costCentre.getCode()

  if (costCentre.name !== undefined) {
    result.name = new core.Text(costCentre.name)
  }
  return result
}

abstract class CostCentre {
  identifier?: Array<fhir.Identifier>
  name?: string
  telecom?: Array<fhir.ContactPoint>
  address?: Array<fhir.Address>

  getOrganizationId() {
    const organizationSdsId = getIdentifierValueForSystem(this.identifier, "https://fhir.nhs.uk/Id/ods-organization-code")
    return new codes.SdsOrganizationIdentifier(organizationSdsId)
  }

  abstract getCode(): codes.OrganizationTypeCode
}

class CostCentreOrganization extends CostCentre implements fhir.Organization {
  resourceType: "Organization"
  type?: Array<fhir.CodeableConcept>

  constructor(fhirOrganization: fhir.Organization) {
    super()
    Object.assign(this, fhirOrganization)
  }

  /**
   *  Currently hard coded 008 when there is no type code
   *  confirmed with Chris this is correct, but eventually this may need to be replaced with a map of values
   */
  getCode() {
    const organizationTypeCoding = getCodeableConceptCodingForSystemOrNull(this?.type, "https://fhir.nhs.uk/R4/CodeSystem/organisation-type")
    return new codes.OrganizationTypeCode(organizationTypeCoding ? organizationTypeCoding.code : "008")
  }
}

class CostCentreHealthcareService extends CostCentre implements fhir.HealthcareService{
  resourceType: "HealthcareService"
  location?: Array<fhir.Reference<fhir.Location>>

  constructor(healthcareService: fhir.HealthcareService, fhirBundle: fhir.Bundle){
    super()
    Object.assign(this, healthcareService)
    this.getAddress(fhirBundle)
  }

  getAddress(fhirBundle: fhir.Bundle) {
    if (this.location !== undefined) {
      const location = (getResourceForFullUrl(fhirBundle, this.location[0].reference) as fhir.Location)
      if (location?.address != undefined) {
        this.address = [location.address]
      }
    }
  }

  getCode(){
    return new codes.OrganizationTypeCode("999")
  }
}
