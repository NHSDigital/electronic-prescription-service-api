import * as codes from "./codes"
import * as core from "./core"
import {ElementCompact} from "xml-js"
import * as organization from "./organization"
import * as demographics from "./demographics"

export type PrescriptionAuthorId = codes.ProfessionalCode | codes.PrescribingCode
export type PrescriptionDispenseAuthorId = codes.SdsUniqueIdentifier

/**
 * A participation used to provide a link from an act to a role in this case used to convey that the role (participant)
 * is the author for the act.
 */
export class Author implements ElementCompact {
  _attributes: core.AttributeTypeCode = {
    typeCode: "AUT"
  }

  AgentPerson: AgentPerson
}

export class ResponsibleParty implements ElementCompact {
  _attributes: core.AttributeTypeCode = {
    typeCode: "RESP"
  }

  AgentPerson: AgentPerson
}

export class Performer implements ElementCompact {
  _attributes: core.AttributeTypeCode = {
    typeCode: "PRF"
  }

  AgentPerson: AgentPerson
}

export class LegalAuthenticator implements ElementCompact {
  _attributes: core.AttributeTypeCode = {
    typeCode: "LA"
  }

  AgentPerson: AgentPerson
}

export class AuthorPersonSds implements ElementCompact {
  _attributes: core.AttributeTypeCode = {
    typeCode: "AUT"
  }

  AgentPersonSDS: AgentPersonSds

  constructor(agentPersonSds: AgentPersonSds) {
    this.AgentPersonSDS = agentPersonSds
  }
}

export class AuthorSystemSds implements ElementCompact {
  _attributes: core.AttributeTypeCode = {
    typeCode: "AUT"
  }

  AgentSystemSDS: AgentSystemSds

  constructor(agentSystemSds: AgentSystemSds) {
    this.AgentSystemSDS = agentSystemSds
  }
}

/**
 * Identifies or provides detailed information about a person fulfilling a specific role when it is not known whether
 * all of the role profile, player and scoper details are available from SDS.
 */
export class AgentPerson implements ElementCompact {
  _attributes: core.AttributeClassCode = {
    classCode: "AGNT"
  }

  id?: codes.SdsRoleProfileIdentifier
  code: codes.SdsJobRoleCode
  telecom?: Array<demographics.Telecom>
  agentPerson: AgentPersonPerson
  representedOrganization: organization.Organization
}

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

export class AgentPersonSds implements ElementCompact {
  _attributes: core.AttributeClassCode = {
    classCode: "AGNT"
  }

  id: codes.SdsRoleProfileIdentifier
  agentPersonSDS: AgentPersonPersonSds
  part?: AgentPersonPart
}

export class AgentPersonPersonSds {
  _attributes: core.AttributeClassCode & core.AttributeDeterminerCode = {
    classCode: "PSN",
    determinerCode: "INSTANCE"
  }

  id: codes.ProfessionalCode | codes.SdsUniqueIdentifier

  constructor(id: codes.ProfessionalCode | codes.SdsUniqueIdentifier) {
    this.id = id
  }
}

export class AgentPersonPart {
  _attributes: core.AttributeTypeCode = {
    typeCode: "PART"
  }

  partSDSRole: SdsRole

  constructor(sdsRole: SdsRole) {
    this.partSDSRole = sdsRole
  }
}

export class SdsRole {
  _attributes: core.AttributeClassCode = {
    classCode: "ROL"
  }

  id: codes.SdsJobRoleIdentifier

  constructor(id: codes.SdsJobRoleIdentifier) {
    this.id = id
  }
}

export class AgentSystemSds implements ElementCompact {
  _attributes: core.AttributeClassCode = {
    classCode: "AGNT"
  }

  agentSystemSDS: AgentSystemSystemSds

  constructor(systemSds: AgentSystemSystemSds) {
    this.agentSystemSDS = systemSds
  }
}

export class AgentSystemSystemSds {
  _attributes: core.AttributeClassCode & core.AttributeDeterminerCode = {
    classCode: "DEV",
    determinerCode: "INSTANCE"
  }

  id: codes.AccreditedSystemIdentifier

  constructor(id: codes.AccreditedSystemIdentifier) {
    this.id = id
  }
}
