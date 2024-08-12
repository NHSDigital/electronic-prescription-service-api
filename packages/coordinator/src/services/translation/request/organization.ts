import {
  getIdentifierValueForSystem,
  identifyMessageType,
  onlyElement,
  resolveReference
} from "../common"
import {convertAddress, convertTelecom} from "./demographics"
import {hl7V3, fhir, processingErrors as errors} from "@models"
import {OrganisationTypeCode} from "../common/organizationTypeCode"

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
  const representedOrganization = healthcareService
    ? new CostCentreHealthcareService(healthcareService)
    : new CostCentreOrganization(organization)

  return convertRepresentedOrganizationDetails(representedOrganization, bundle)
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
  const hl7V3ParentOrganization = convertCommonOrganizationDetails(costCentreParentOrganization)
  return new hl7V3.HealthCareProviderLicense(hl7V3ParentOrganization)
}

function convertRepresentedOrganizationDetails(
  costCentre: CostCentre,
  bundle: fhir.Bundle
): hl7V3.Organization {
  const result = convertCommonOrganizationDetails(costCentre)

  const telecomFhirPath = `${costCentre.resourceType}.telecom`
  const telecom = onlyElement(costCentre.telecom, telecomFhirPath)
  result.telecom = convertTelecom(telecom, telecomFhirPath)

  const addressFhirPath = costCentre.getAddressFhirPath()
  const address = costCentre.getAddress(bundle)
  result.addr = convertAddress(address, addressFhirPath)

  return result
}

function convertCommonOrganizationDetails(
  costCentre: CostCentre
): hl7V3.Organization {
  const result = new hl7V3.Organization()

  const organizationSdsId = getIdentifierValueForSystem(
    costCentre.identifier,
    "https://fhir.nhs.uk/Id/ods-organization-code",
    `${costCentre.resourceType}.identifier`
  )
  result.id = new hl7V3.SdsOrganizationIdentifier(organizationSdsId)
  result.code = new hl7V3.OrganizationTypeCode(OrganisationTypeCode.NOT_SPECIFIED) //See ticket AEA-2493
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
