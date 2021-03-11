import {
  getCodeableConceptCodingForSystemOrNull,
  getIdentifierValueForSystem,
  onlyElement,
  resolveReference
} from "../common"
import {convertAddress, convertTelecom} from "./demographics"
import {InvalidValueError} from "../../../models/errors/processing-errors"
import {identifyMessageType} from "../../../routes/util"
import * as hl7V3 from "../../../models/hl7-v3"
import * as fhir from "../../../models/fhir"
import pino from "pino"
import {odsClient} from "../../../services/communication/ods-client"

const NHS_TRUST_CODE = "197"

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
    throw new InvalidValueError(
      `A HealthcareService must be provided if the Organization role is '${NHS_TRUST_CODE}'.`,
      "PractitionerRole.healthcareService"
    )
  }
  const representedOrganization = shouldUseHealthcareService
    ? new CostCentreHealthcareService(healthcareService)
    : new CostCentreOrganization(organization)
  return convertRepresentedOrganizationDetails(representedOrganization, bundle)
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
  const hl7V3ParentOrganization = convertCommonOrganizationDetails(costCentreParentOrganization)
  return new hl7V3.HealthCareProviderLicense(hl7V3ParentOrganization)
}

function convertRepresentedOrganizationDetails(costCentre: CostCentre, bundle: fhir.Bundle): hl7V3.Organization {
  const result = convertCommonOrganizationDetails(costCentre)

  const telecomFhirPath = `${costCentre.resourceType}.telecom`
  const telecom = onlyElement(costCentre.telecom, telecomFhirPath)
  result.telecom = convertTelecom(telecom, telecomFhirPath)

  const addressFhirPath = costCentre.getAddressFhirPath()
  const address = costCentre.getAddress(bundle)
  result.addr = convertAddress(address, addressFhirPath)

  return result
}

function convertCommonOrganizationDetails(costCentre: CostCentre): hl7V3.Organization {
  const result = new hl7V3.Organization()

  const organizationSdsId = getIdentifierValueForSystem(
    costCentre.identifier,
    "https://fhir.nhs.uk/Id/ods-organization-code",
    `${costCentre.resourceType}.identifier`
  )
  result.id = new hl7V3.SdsOrganizationIdentifier(organizationSdsId)
  result.code = new hl7V3.OrganizationTypeCode()
  if (!costCentre.name) {
    throw new InvalidValueError("Name must be provided.", `${costCentre.resourceType}.address`)
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
      throw new InvalidValueError("Address must be provided.", "Location.address")
    }
    return location.address
  }
  getAddressFhirPath(): string {
    return "Location.address"
  }
}

export async function getRepresentedOrganization(
  organizationCode: string,
  logger: pino.Logger
): Promise<hl7V3.Organization> {
  const organization = await odsClient.lookupOrganization(organizationCode, logger)
  if (!organization) {
    throw new InvalidValueError(
      `No organisation details found for code ${organizationCode}`,
      "Parameters.parameter"
    )
  }
  return convertOrganization(organization)
}

function convertOrganization(organization: fhir.Organization): hl7V3.Organization {
  const hl7V3Organization = new hl7V3.Organization()
  const organizationSdsId = getIdentifierValueForSystem(
    organization.identifier,
    "https://fhir.nhs.uk/Id/ods-organization-code",
    `Organization.identifier`
  )
  hl7V3Organization.id = new hl7V3.SdsOrganizationIdentifier(organizationSdsId)
  hl7V3Organization.code = new hl7V3.OrganizationTypeCode()
  if (organization.name) {
    hl7V3Organization.name = new hl7V3.Text(organization.name)
  }
  if (organization.telecom?.length) {
    hl7V3Organization.telecom = convertTelecom(organization.telecom[0], "Organization.telecom")
  }
  if (organization.address?.length) {
    hl7V3Organization.addr = convertAddress(organization.address[0], "Organization.address")
  }
  return hl7V3Organization
}
