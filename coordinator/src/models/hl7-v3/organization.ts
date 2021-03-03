import {ElementCompact} from "xml-js"
import * as core from "./core"
import * as codes from "./codes"
import * as demographics from "./demographics"

/**
 * Details of an organisation on SDS.
 */
export class Organization implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeDeterminerCode = {
    classCode: "ORG",
    determinerCode: "INSTANCE"
  }

  id: codes.SdsOrganizationIdentifier
  code?: codes.OrganizationTypeCode
  name?: core.Text
  telecom?: demographics.Telecom
  addr?: demographics.Address
  healthCareProviderLicense?: HealthCareProviderLicense
}

/**
 * A link to a controlling organisation.
 */
export class HealthCareProviderLicense implements ElementCompact {
  _attributes: core.AttributeClassCode = {
    classCode: "PROV"
  }

  Organization: Organization

  constructor(organization: Organization) {
    this.Organization = organization
  }
}

/**
 * Identifies an organization fulfilling a specific role. Full details of the organization are available from SDS.
 * Details of the scoping organization are either not required or available from SDS.
 */
export class AgentOrganizationSDS implements ElementCompact {
  _attributes: core.AttributeClassCode = {
    classCode: "AGNT"
  }

  agentOrganizationSDS: Organization

  constructor(organization: Organization) {
    this.agentOrganizationSDS = organization
  }
}

/**
 * Identifies or provides detailed information about an organization fulfilling a specific role when it is not known
 * whether the player and/or scoper details are available from SDS.
 */
export class AgentOrganization implements ElementCompact {
  _attributes: core.AttributeClassCode = {
    classCode: "AGNT"
  }

  agentOrganization: Organization

  constructor(organization: Organization) {
    this.agentOrganization = organization
  }
}
