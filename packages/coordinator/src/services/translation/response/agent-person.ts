import {fhir, hl7V3} from "@models"
import {createPractitioner} from "./practitioner"
import {
  createHealthcareService,
  createLocations,
  createOrganization,
  getOrganizationCodeIdentifier
} from "./organization"
import {createPractitionerRole, createRefactoredPractitionerRole} from "./practitioner-role"
import {createPractitionerOrRoleIdentifier} from "./identifiers"
import {prescriptionRefactorEnabled} from "../../../utils/feature-flags"
import {addIdentifierToPractitionerOrRole} from "./common"

interface TranslatedAgentPerson {
  practitionerRole: fhir.PractitionerRole
  practitioner?: fhir.Practitioner
  healthcareService?: fhir.HealthcareService
  locations: Array<fhir.Location>
  organization?: fhir.Organization
}

class TranslatedAgentPersonFactory {
  private readonly agentPerson: hl7V3.AgentPerson
  private readonly prescriptionType?: string
  private readonly representedOrganization: hl7V3.Organization

  constructor(agentPerson: hl7V3.AgentPerson, prescriptionType?: string) {
    this.agentPerson= agentPerson
    this.prescriptionType = prescriptionType
    this.representedOrganization = agentPerson.representedOrganization
  }

  translate(): TranslatedAgentPerson {
    if (prescriptionRefactorEnabled()) {
      return this.createWithRefactorEnabled()
    }

    if (shouldHavePrimaryCareFormat(this.prescriptionType)) {
      return this.createWithPrimaryCareFormat()
    } else {
      return this.createWithSecondaryCareFormat()
    }
  }

  private createWithRefactorEnabled() {
    const practitionerRole = createRefactoredPractitionerRole(this.agentPerson)
    const locations = createLocations(this.representedOrganization)

    return {
      practitionerRole,
      locations
    }
  }

  private createWithPrimaryCareFormat() {
    const organization = createOrganization(this.representedOrganization)
    const practitioner = createPractitioner(this.agentPerson)
    const practitionerRole = createPractitionerRole(this.agentPerson, practitioner.id)
    practitionerRole.organization = fhir.createReference(organization.id)

    const healthCareProviderLicenseOrganization = this.representedOrganization.healthCareProviderLicense?.Organization
    if (healthCareProviderLicenseOrganization) {
      organization.partOf = {
        identifier: getOrganizationCodeIdentifier(healthCareProviderLicenseOrganization.id._attributes.extension),
        display: healthCareProviderLicenseOrganization.name?._text
      }
    }

    const translatedAgentPerson: TranslatedAgentPerson = {
      practitionerRole,
      practitioner,
      healthcareService: null,
      locations: [],
      organization
    }

    return translatedAgentPerson
  }

  private createWithSecondaryCareFormat() {
    const healthCareOrganization = this.representedOrganization.healthCareProviderLicense?.Organization
    let hl7Organization = this.representedOrganization
    if (healthCareOrganization) {
      hl7Organization = {
        ...this.representedOrganization,
        id: healthCareOrganization.id,
        name: healthCareOrganization.name
      }
    }
    const organization = createOrganization(hl7Organization)
    const practitioner = createPractitioner(this.agentPerson)
    const practitionerRole = createPractitionerRole(this.agentPerson, practitioner.id)
    practitionerRole.organization = fhir.createReference(organization.id)
    const locations = createLocations(this.representedOrganization)

    const healthcareService = createHealthcareService(this.representedOrganization, locations)
    healthcareService.providedBy = {
      identifier: organization.identifier[0],
      display: organization.name
    }

    practitionerRole.healthcareService = [fhir.createReference(healthcareService.id)]

    const translatedAgentPerson: TranslatedAgentPerson = {
      practitionerRole,
      practitioner,
      healthcareService,
      locations,
      organization
    }

    return translatedAgentPerson
  }
}

function translateAgentPerson(agentPerson: hl7V3.AgentPerson, prescriptionType?: string): TranslatedAgentPerson {
  const factory = new TranslatedAgentPersonFactory(agentPerson, prescriptionType)
  return factory.translate()
}

function shouldHavePrimaryCareFormat(prescriptionType?: string): boolean {
  return prescriptionType?.startsWith("01", 0)
}

function addTranslatedAgentPerson(
  bundleResources: Array<fhir.Resource>,
  translatedAgentPerson: TranslatedAgentPerson
): void {
  bundleResources.push(
    translatedAgentPerson.practitionerRole,
    ...translatedAgentPerson.locations
  )
  if (translatedAgentPerson.practitioner) {
    bundleResources.push(translatedAgentPerson.practitioner)
  }
  if (translatedAgentPerson.organization) {
    bundleResources.push(translatedAgentPerson.organization)
  }
  if (translatedAgentPerson.healthcareService) {
    bundleResources.push(translatedAgentPerson.healthcareService)
  }
}

function addDetailsToTranslatedAgentPerson(
  translatedAgentPerson: TranslatedAgentPerson,
  agentPerson: hl7V3.AgentPerson
): void {
  const userId = agentPerson.agentPerson.id._attributes.extension
  const identifier = createPractitionerOrRoleIdentifier(userId)
  addIdentifierToPractitionerOrRole(
    translatedAgentPerson.practitionerRole,
    translatedAgentPerson.practitioner,
    identifier
  )
}

export {
  translateAgentPerson,
  addTranslatedAgentPerson,
  addDetailsToTranslatedAgentPerson
}

export type {TranslatedAgentPerson}
