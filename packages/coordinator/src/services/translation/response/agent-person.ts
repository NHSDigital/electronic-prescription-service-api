import {fhir, hl7V3} from "@models"
import {createPractitioner} from "./practitioner"
import {createOrganization, getOrganizationCodeIdentifier} from "./organization"
import {createPractitionerRole} from "./practitioner-role"
import {createPractitionerOrRoleIdentifier} from "./identifiers"
import {addIdentifierToPractitionerOrRole} from "./common"

interface TranslatedAgentPerson {
  practitionerRole: fhir.PractitionerRole
  practitioner: fhir.Practitioner
  organization: fhir.Organization
}

class TranslatedAgentPersonFactory {
  private readonly agentPerson: hl7V3.AgentPerson
  private readonly representedOrganization: hl7V3.Organization

  constructor(agentPerson: hl7V3.AgentPerson) {
    this.agentPerson= agentPerson
    this.representedOrganization = agentPerson.representedOrganization
  }

  translate(): TranslatedAgentPerson {
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
      organization
    }

    return translatedAgentPerson
  }
}

function translateAgentPerson(agentPerson: hl7V3.AgentPerson): TranslatedAgentPerson {
  const factory = new TranslatedAgentPersonFactory(agentPerson)
  return factory.translate()
}

function addTranslatedAgentPerson(
  bundleResources: Array<fhir.Resource>,
  translatedAgentPerson: TranslatedAgentPerson
): void {
  bundleResources.push(
    translatedAgentPerson.practitionerRole
  )
  if (translatedAgentPerson.practitioner) {
    bundleResources.push(translatedAgentPerson.practitioner)
  }
  if (translatedAgentPerson.organization) {
    bundleResources.push(translatedAgentPerson.organization)
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
