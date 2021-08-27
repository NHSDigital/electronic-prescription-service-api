import * as core from "./core"
import * as codes from "./codes"
import {ElementCompact} from "xml-js"
import * as organisation from "./organization"
import {DispenseNotificationPertinentInformation1, ReplacementOf, SequelTo} from "./dispense-notification"

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
  //receiver: something that wraps Agent
  pertinentInformation1: DispenseNotificationPertinentInformation1
  //pertinentInformation2: PertinentInformation2
  replacementOf?: ReplacementOf
  //coverage: Coverage
  sequelTo: SequelTo

  constructor(id: codes.GlobalIdentifier) {
    this.id = id
    this.code = new codes.SnomedCode(
      "163541000000107",
      "Dispensed Medication - FocusActOrEvent (administrative concept)"
    )
    this.effectiveTime = new core.Timestamp("PLACEHOLDER")
    this.typeId = new codes.TypeIdentifier("PORX_MT142001UK31")
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
