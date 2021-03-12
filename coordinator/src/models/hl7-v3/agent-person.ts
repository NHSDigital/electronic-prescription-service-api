import * as codes from "./codes"
import * as core from "./core"
import {ElementCompact} from "xml-js"
import * as organization from "./organization"
import * as demographics from "./demographics"

/**
 * Identifies or provides detailed information about a person fulfilling a specific role when it is not known whether
 * all of the role profile, player and scoper details are available from SDS.
 */
export class AgentPerson implements ElementCompact {
    _attributes: core.AttributeClassCode = {
      classCode: "AGNT"
    }

    id: codes.SdsRoleProfileIdentifier
    code: codes.SdsJobRoleCode
    telecom?: Array<demographics.Telecom>
    agentPerson: AgentPersonPerson
    representedOrganization: organization.Organization
}

export type PrescriptionAuthorId = codes.ProfessionalCode | codes.PrescribingCode
export type PrescriptionDispenseAuthorId = codes.SdsUniqueIdentifier

/**
 * Details of a person on SDS.
 */
export class AgentPersonPerson implements ElementCompact {
    _attributes: core.AttributeClassCode & core.AttributeDeterminerCode = {
      classCode: "PSN",
      determinerCode: "INSTANCE"
    }

    id: PrescriptionAuthorId | PrescriptionDispenseAuthorId
    name?: demographics.Name

    constructor(id: PrescriptionAuthorId | PrescriptionDispenseAuthorId) {
      this.id = id
    }
}
