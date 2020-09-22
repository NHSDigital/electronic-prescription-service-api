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

const NHS_TRUST_CODE = "RO197"

export function convertOrganizationAndProviderLicense(
  fhirBundle: fhir.Bundle,
  fhirOrganization: fhir.Organization,
  fhirHealthcareService: fhir.HealthcareService,
  isCancellation: boolean
): peoplePlaces.Organization {
  const hl7V3Organization = convertRepresentedOrganization(fhirOrganization, fhirHealthcareService, fhirBundle, isCancellation)

  if (!isCancellation){
    hl7V3Organization.healthCareProviderLicense = convertHealthCareProviderLicense(fhirOrganization, fhirBundle)
  }

  return hl7V3Organization
}

function convertRepresentedOrganization(fhirOrganization: fhir.Organization, fhirHealthcareService: fhir.HealthcareService, fhirBundle: fhir.Bundle, isCancellation: boolean) {
  const organizationTypeCoding = getCodeableConceptCodingForSystemOrNull(
    fhirOrganization.type,
    "https://fhir.nhs.uk/R4/CodeSystem/organisation-role",
    "Organization.type"
  )
  const representedOrganization = (organizationTypeCoding?.code === NHS_TRUST_CODE && !isCancellation) ?
    new CostCentreHealthcareService(fhirHealthcareService) : new CostCentreOrganization(fhirOrganization)
  return convertRepresentedOrganizationDetails(representedOrganization, fhirBundle)
}

function convertHealthCareProviderLicense(fhirOrganization: fhir.Organization, fhirBundle: fhir.Bundle) {
  const fhirParentOrganization = new CostCentreOrganization(fhirOrganization.partOf ? resolveReference(fhirBundle, fhirOrganization.partOf) : fhirOrganization)
  return new peoplePlaces.HealthCareProviderLicense(convertCommonOrganizationDetails(fhirParentOrganization))
}

function convertRepresentedOrganizationDetails(costCentre: CostCentre, fhirBundle: fhir.Bundle): peoplePlaces.Organization {
  const result = convertCommonOrganizationDetails(costCentre)

  const telecom = costCentre.getTelecom()
  if (telecom) {
    result.telecom = telecom
  }

  const address = costCentre.getAddress(fhirBundle)
  if (address) {
    result.addr = address
  }

  return result
}

function convertCommonOrganizationDetails(costCentre: CostCentre): peoplePlaces.Organization {
  const result = new peoplePlaces.Organization()
  result.id = costCentre.getOrganizationId()

  result.code = costCentre.getCode()

  const name = costCentre.getName()
  if (name) {
    result.name = name
  }

  return result
}

abstract class CostCentre {
  resourceType: string
  identifier?: Array<fhir.Identifier>
  name?: string
  telecom?: Array<fhir.ContactPoint>

  getName() {
    if (this.name) {
      return new core.Text(this.name)
    }
    return null
  }

  getOrganizationId() {
    const organizationSdsId = getIdentifierValueForSystem(
      this.identifier,
      "https://fhir.nhs.uk/Id/ods-organization-code",
      `${this.resourceType}.identifier`
    )
    return new codes.SdsOrganizationIdentifier(organizationSdsId)
  }

  getTelecom() {
    if (this.telecom) {
      return convertTelecom(
        onlyElement(this.telecom, `${this.resourceType}.telecom`),
        `${this.resourceType}.telecom`
      )
    }
    return null
  }

  abstract getCode(): codes.OrganizationTypeCode

  abstract getAddress(fhirBundle: fhir.Bundle): core.Address
}

class CostCentreOrganization extends CostCentre implements fhir.Organization {
  resourceType: "Organization"
  type?: Array<fhir.CodeableConcept>
  address?: Array<fhir.Address>

  constructor(fhirOrganization: fhir.Organization) {
    super()
    Object.assign(this, fhirOrganization)
  }

  /**
   *  Currently hard coded 008 when there is no type code
   *  confirmed with Chris this is correct, but eventually this may need to be replaced with a map of values
   */
  getCode() {
    const organizationTypeCoding = getCodeableConceptCodingForSystemOrNull(
      this.type,
      "https://fhir.nhs.uk/R4/CodeSystem/organisation-type",
      "Organization.type"
    )
    return new codes.OrganizationTypeCode(organizationTypeCoding ? organizationTypeCoding.code : "008")
  }

  getAddress() {
    if (this.address) {
      return convertAddress(
        onlyElement(this.address, "Organization.address"),
        "Organization.address"
      )
    }
    return null
  }
}

class CostCentreHealthcareService extends CostCentre implements fhir.HealthcareService {
  resourceType: "HealthcareService"
  location?: Array<fhir.Reference<fhir.Location>>

  constructor(healthcareService: fhir.HealthcareService) {
    super()
    Object.assign(this, healthcareService)
  }

  getCode() {
    return new codes.OrganizationTypeCode("999")
  }

  getAddress(fhirBundle: fhir.Bundle) {
    if (this.location?.length) {
      const location = resolveReference(fhirBundle, this.location[0])
      if (location.address) {
        return convertAddress(location.address, "Location.address")
      }
    }
    return null
  }
}
