import {
  getCodeableConceptCodingForSystemOrNull,
  getIdentifierValueForSystem,
  identifyMessageType,
  onlyElement,
  resolveReference
} from "../common"
import {convertAddress, convertTelecom} from "./demographics"
import {hl7V3, fhir, processingErrors as errors} from "@models"

const NHS_TRUST_CODE = "197"

export enum OrganisationTypeCode {
  GENERAL_MEDICAL_PRACTICE = "001",
  GENERAL_DENTAL_PRACTICE = "002",
  COMMUNITY_PHARMACY = "003",
  COMMUNITY_OPTICIANS = "004",
  PRIMARY_CARE_TRUST = "005",
  STRATEGIC_HEALTH_AUTHORITY = "006",
  SPECIAL_HEALTH_AUTHORITY = "007",
  ACUTE_TRUST = "008",
  CARE_TRUST = "009",
  COMMUNITY_TRUST = "010",
  DIAGNOSTIC_AND_INVESTIGATION_CENTRE = "011",
  WALK_IN_CENTRE = "012",
  NHS_DIRECT = "013",
  LOCAL_AUTHORITY_SOCIAL_SERVICES_DEPARTMENT = "014",
  NURSING_HOME = "015",
  RESIDENTIAL_HOME = "016",
  HOSPICE = "017",
  AMBULANCE_TRUST = "018",
  PRIVATE_HOSPITAL = "019",
  GMP_DEPUTISING_SERVICE = "020",
  NURSING_AGENCY = "021",
  NOT_SPECIFIED = "999"
}

const SECONDARY_CARE_ORGANISATION_TYPE_CODES = [
  OrganisationTypeCode.ACUTE_TRUST,
  OrganisationTypeCode.CARE_TRUST,
  OrganisationTypeCode.COMMUNITY_TRUST,
  OrganisationTypeCode.AMBULANCE_TRUST
]

enum CareSetting {
  PRIMARY_CARE,
  SECONDARY_CARE
}

export function getCareSetting(organisationTypeCode: OrganisationTypeCode): CareSetting {
  if (SECONDARY_CARE_ORGANISATION_TYPE_CODES.includes(organisationTypeCode)) {
    return CareSetting.SECONDARY_CARE
  }
  return CareSetting.PRIMARY_CARE
}

export function convertOrganizationAndProviderLicense(
  bundle: fhir.Bundle,
  fhirOrganization: fhir.Organization,
  healthcareService: fhir.HealthcareService
): hl7V3.Organization {
  const hl7V3Organization = convertRepresentedOrganization(fhirOrganization, healthcareService, bundle)

  if (identifyMessageType(bundle) !== fhir.EventCodingCode.CANCELLATION) {
    hl7V3Organization.healthCareProviderLicense = convertHealthCareProviderLicense(fhirOrganization, bundle)
  }

  return hl7V3Organization
}

function convertRepresentedOrganization(
  organization: fhir.Organization,
  healthcareService: fhir.HealthcareService,
  bundle: fhir.Bundle
): hl7V3.Organization {
  const shouldUseHealthcareService = isNhsTrust(organization)
  if (shouldUseHealthcareService && !healthcareService) {
    throw new errors.InvalidValueError(
      `A HealthcareService must be provided if the Organization role is '${NHS_TRUST_CODE}'.`,
      "PractitionerRole.healthcareService"
    )
  }
  const representedOrganization = shouldUseHealthcareService
    ? new CostCentreHealthcareService(healthcareService)
    : new CostCentreOrganization(organization)

  const organisationTypeCode = healthcareService
    ? SECONDARY_CARE_ORGANISATION_TYPE_CODES[0]
    : OrganisationTypeCode.NOT_SPECIFIED
  return convertRepresentedOrganizationDetails(representedOrganization, organisationTypeCode, bundle)
}

function isNhsTrust(organization: fhir.Organization) {
  const organizationTypeCoding = getCodeableConceptCodingForSystemOrNull(
    organization.type,
    "https://fhir.nhs.uk/CodeSystem/organisation-role",
    "Organization.type"
  )
  return organizationTypeCoding?.code === NHS_TRUST_CODE
}

function isDirectReference<T extends fhir.Resource>(
  reference: fhir.Reference<T> | fhir.IdentifierReference<T>
): reference is fhir.Reference<T> {
  return !!(reference as fhir.Reference<T>).reference
}

function convertHealthCareProviderLicense(organization: fhir.Organization, bundle: fhir.Bundle) {
  let fhirParentOrganization = organization
  const partOf = organization.partOf
  if (partOf) {
    if (isDirectReference(partOf)) {
      fhirParentOrganization = resolveReference(bundle, partOf)
    } else {
      //TODO - Fix error FHIR paths for this case?
      fhirParentOrganization = {
        resourceType: "Organization",
        identifier: [
          partOf.identifier
        ],
        name: partOf.display
      }
    }
  }
  const costCentreParentOrganization = new CostCentreOrganization(fhirParentOrganization)
  const hl7V3ParentOrganization = convertCommonOrganizationDetails(
    costCentreParentOrganization,
    OrganisationTypeCode.NOT_SPECIFIED)
  return new hl7V3.HealthCareProviderLicense(hl7V3ParentOrganization)
}

function convertRepresentedOrganizationDetails(
  costCentre: CostCentre,
  organisationTypeCode: string,
  bundle: fhir.Bundle
): hl7V3.Organization {
  const result = convertCommonOrganizationDetails(costCentre, organisationTypeCode)

  const telecomFhirPath = `${costCentre.resourceType}.telecom`
  const telecom = onlyElement(costCentre.telecom, telecomFhirPath)
  result.telecom = convertTelecom(telecom, telecomFhirPath)

  const addressFhirPath = costCentre.getAddressFhirPath()
  const address = costCentre.getAddress(bundle)
  result.addr = convertAddress(address, addressFhirPath)

  return result
}

function convertCommonOrganizationDetails(
  costCentre: CostCentre,
  organisationTypeCode: string
): hl7V3.Organization {
  const result = new hl7V3.Organization()

  const organizationSdsId = getIdentifierValueForSystem(
    costCentre.identifier,
    "https://fhir.nhs.uk/Id/ods-organization-code",
    `${costCentre.resourceType}.identifier`
  )
  result.id = new hl7V3.SdsOrganizationIdentifier(organizationSdsId)
  result.code = new hl7V3.OrganizationTypeCode(organisationTypeCode)
  if (!costCentre.name) {
    throw new errors.InvalidValueError("Name must be provided.", `${costCentre.resourceType}.address`)
  }
  result.name = new hl7V3.Text(costCentre.name)

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
      throw new errors.InvalidValueError("Address must be provided.", "Location.address")
    }
    return location.address
  }
  getAddressFhirPath(): string {
    return "Location.address"
  }
}
