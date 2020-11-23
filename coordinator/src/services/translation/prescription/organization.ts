import * as fhir from "../../../models/fhir/fhir-resources"
import * as peoplePlaces from "../../../models/hl7-v3/hl7-v3-people-places"
import {
  getCodeableConceptCodingForSystemOrNull,
  getIdentifierValueForSystem,
  onlyElement,
  resolveReference
} from "../common"
import * as codes from "../../../models/hl7-v3/hl7-v3-datatypes-codes"
import * as core from "../../../models/hl7-v3/hl7-v3-datatypes-core"
import {convertAddress, convertTelecom} from "./demographics"
import {InvalidValueError} from "../../../models/errors/processing-errors"

const NHS_TRUST_CODE = "RO197"

export function convertOrganizationAndProviderLicense(
  fhirBundle: fhir.Bundle,
  fhirOrganization: fhir.Organization,
  fhirHealthcareService: fhir.HealthcareService,
  isCancellation: boolean
): peoplePlaces.Organization {
  const hl7V3Organization = convertRepresentedOrganization(fhirOrganization, fhirHealthcareService, fhirBundle)

  if (!isCancellation) {
    hl7V3Organization.healthCareProviderLicense = convertHealthCareProviderLicense(fhirOrganization, fhirBundle)
  }

  return hl7V3Organization
}

function convertRepresentedOrganization(
  fhirOrganization: fhir.Organization,
  fhirHealthcareService: fhir.HealthcareService,
  fhirBundle: fhir.Bundle
) {
  const representedOrganization = isNhsTrust(fhirOrganization)
    ? new CostCentreHealthcareService(fhirHealthcareService)
    : new CostCentreOrganization(fhirOrganization)
  return convertRepresentedOrganizationDetails(representedOrganization, fhirBundle)
}

function isNhsTrust(fhirOrganization: fhir.Organization) {
  const organizationTypeCoding = getCodeableConceptCodingForSystemOrNull(
    fhirOrganization.type,
    "https://fhir.nhs.uk/CodeSystem/organisation-role",
    "Organization.type"
  )
  return organizationTypeCoding?.code === NHS_TRUST_CODE
}

function convertHealthCareProviderLicense(fhirOrganization: fhir.Organization, fhirBundle: fhir.Bundle) {
  const fhirParentOrganization = fhirOrganization.partOf
    ? resolveReference(fhirBundle, fhirOrganization.partOf)
    : fhirOrganization
  const costCentreParentOrganization = new CostCentreOrganization(fhirParentOrganization)
  const hl7V3ParentOrganization = convertCommonOrganizationDetails(costCentreParentOrganization)
  return new peoplePlaces.HealthCareProviderLicense(hl7V3ParentOrganization)
}

function convertRepresentedOrganizationDetails(
  costCentre: CostCentre,
  fhirBundle: fhir.Bundle
): peoplePlaces.Organization {
  const result = convertCommonOrganizationDetails(costCentre)

  const telecomFhirPath = `${costCentre.resourceType}.telecom`
  const telecom = onlyElement(costCentre.telecom, telecomFhirPath)
  result.telecom = convertTelecom(telecom, telecomFhirPath)

  const addressFhirPath = costCentre.getAddressFhirPath()
  const address = costCentre.getAddress(fhirBundle)
  result.addr = convertAddress(address, addressFhirPath)

  return result
}

function convertCommonOrganizationDetails(costCentre: CostCentre): peoplePlaces.Organization {
  const result = new peoplePlaces.Organization()

  const organizationSdsId = getIdentifierValueForSystem(
    costCentre.identifier,
    "https://fhir.nhs.uk/Id/ods-organization-code",
    `${costCentre.resourceType}.identifier`
  )
  result.id = new codes.SdsOrganizationIdentifier(organizationSdsId)
  result.code = new codes.OrganizationTypeCode("999")
  result.name = new core.Text(costCentre.name)

  return result
}

abstract class CostCentre {
  resourceType: string
  identifier?: Array<fhir.Identifier>
  name?: string
  telecom?: Array<fhir.ContactPoint>

  abstract getAddress(fhirBundle: fhir.Bundle): fhir.Address
  abstract getAddressFhirPath(): string
}

class CostCentreOrganization extends CostCentre implements fhir.Organization {
  resourceType: "Organization"
  type?: Array<fhir.CodeableConcept>
  address?: Array<fhir.Address>

  constructor(fhirOrganization: fhir.Organization) {
    super()
    Object.assign(this, fhirOrganization)
  }

  getAddress() {
    return onlyElement(this.address, "Organization.address")
  }
  getAddressFhirPath(): string {
    return "Organization.address"
  }
}

class CostCentreHealthcareService extends CostCentre implements fhir.HealthcareService {
  resourceType: "HealthcareService"
  location?: Array<fhir.Reference<fhir.Location>>

  constructor(healthcareService: fhir.HealthcareService) {
    super()
    Object.assign(this, healthcareService)
  }

  getAddress(fhirBundle: fhir.Bundle) {
    const locationReference = onlyElement(this.location, "HealthcareService.location")
    const location = resolveReference(fhirBundle, locationReference)
    if (!location.address) {
      throw new InvalidValueError("Address must be provided.", "Location.address")
    }
    return location.address
  }
  getAddressFhirPath(): string {
    return "Location.address"
  }
}
