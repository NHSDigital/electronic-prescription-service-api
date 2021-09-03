import { ElementCompact } from "xml-js"
import { AgentPerson } from "./agent-person"
import * as codes from "./codes"
import * as core from "./core"
import { DispensePertinentInformation1, PertinentSupplyHeader, SequelTo } from "./dispense-common"
import * as organisation from "./organization"

export class DispenseClaimInformationRoot {
  DispenseClaimInformation: DispenseClaimInformation

  constructor(dispenseClaimInformation: DispenseClaimInformation) {
    this.DispenseClaimInformation = dispenseClaimInformation
  }
}

export class DispenseClaimInformation implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "INFO",
    moodCode: "EVN"
  }
  id: codes.GlobalIdentifier
  code: codes.SnomedCode
  effectiveTime: core.Timestamp
  typeId: codes.TypeIdentifier
  primaryInformationRecipient: PrimaryInformationRecipient
  pertinentInformation1: DispensePertinentInformation1
  sequelTo: SequelTo

  constructor(id: codes.GlobalIdentifier, effectiveTime: core.Timestamp) {
    this.id = id
    this.code = new codes.SnomedCode(
      "163541000000107",
      "Dispensed Medication - FocusActOrEvent (administrative concept)"
    )
    this.effectiveTime = effectiveTime
    this.typeId = new codes.TypeIdentifier("PORX_MT142001UK31")
  }
}

export class DispenseClaimPertinentSupplyHeader extends PertinentSupplyHeader {
  legalAuthenticator: LegalAuthenticator

  constructor(id: codes.GlobalIdentifier, legalAuthenticator: LegalAuthenticator) {
    super(id)
    this.legalAuthenticator = legalAuthenticator
  }
}

export class LegalAuthenticator implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextControlCode = {
    typeCode: "LA",
    contextControlCode: "OP"
  }

  time: core.Timestamp
  signatureText: core.Null
  participant: AgentPerson

  constructor(participant: AgentPerson, time: core.Timestamp) {
    this.participant = participant
    this.signatureText = core.Null.NOT_APPLICABLE
  }
}

export class PrimaryInformationRecipient implements ElementCompact {
  _attributes: core.AttributeTypeCode = {
    typeCode: "PRCP"
  }

  AgentOrg: organisation.AgentOrganization

  constructor(organisation: organisation.AgentOrganization) {
    this.AgentOrg = organisation
  }
}
