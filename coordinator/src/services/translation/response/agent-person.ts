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

function translateAgentPerson(agentPerson: hl7V3.AgentPerson, prescriptionType?: string): TranslatedAgentPerson {
  const representedOrganization = agentPerson.representedOrganization

  if (prescriptionRefactorEnabled()) {
    const practitionerRole = createRefactoredPractitionerRole(agentPerson)
    const locations = createLocations(representedOrganization)

    return {
      practitionerRole,
      locations
    }
  } else {
    if (shouldHavePrimaryCareFormat(prescriptionType)) {
      const organization = createOrganization(representedOrganization)
      const practitioner = createPractitioner(agentPerson)
      const practitionerRole = createPractitionerRole(agentPerson, practitioner.id)
      practitionerRole.organization = fhir.createReference(organization.id)

      const healthCareProviderLicenseOrganization = representedOrganization.healthCareProviderLicense?.Organization
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
    } else {
      const healthCareOrganization = representedOrganization.healthCareProviderLicense?.Organization
      let hl7Organization = representedOrganization
      if (healthCareOrganization) {
        hl7Organization = {
          ...representedOrganization,
          id: healthCareOrganization.id,
          name: healthCareOrganization.name
        }
      }
      const organization = createOrganization(hl7Organization)
      const practitioner = createPractitioner(agentPerson)
      const practitionerRole = createPractitionerRole(agentPerson, practitioner.id)
      practitionerRole.organization = fhir.createReference(organization.id)
      const locations = createLocations(representedOrganization)

      const healthcareService = createHealthcareService(representedOrganization, locations)
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
