import * as core from "./core"
import * as codes from "./codes"
import {ElementCompact} from "xml-js"
import * as parentPrescription from "./parent-prescription"
import * as organisation from "./organization"
import * as prescription from "./prescription"

export class DispenseNotificationRoot {
  DispenseNotification: DispenseNotification

  constructor(dispenseNotification: DispenseNotification) {
    this.DispenseNotification = dispenseNotification
  }
}

export class DispenseNotification implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "INFO",
    moodCode: "EVN"
  }
  // = done
  //\ = to un-stub
  id: codes.GlobalIdentifier //
  code: codes.SnomedCode //
  effectiveTime: core.Timestamp //\
  typeId: codes.TypeIdentifier //
  recordTarget: parentPrescription.RecordTarget //\
  primaryInformationRecipient: PrimaryInformationRecipient //\
  // V todo: check if we need supplyHeader V
  pertinentInformation1: DispenseNotificationPertinentInformation1
  // V todo: figure out where CareRecordElementCategoryComponent comes from V
  pertinentInformation2: DispenseNotificationPertinentInformation2
  //replacementOf: < optional, do we support this in fhir?
  sequelTo: SequelTo //\

  constructor(id: codes.GlobalIdentifier) {
    this.id = id
    this.code = new codes.SnomedCode(
      "163541000000107",
      "Dispensed Medication - FocusActOrEvent (administrative concept)"
    )
    this.effectiveTime = new core.Timestamp("PLACEHOLDER")
    this.typeId = new codes.TypeIdentifier("PORX_MT024001UK31")
  }
}

export class PrimaryInformationRecipient implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextControlCode = {
    typeCode: "PRCP",
    contextControlCode: "ON"
  }

  AgentOrg: organisation.AgentOrganization
}

/*
 * An act relationship that associates the DispenseNotification focal act with
 * SupplyHeader - the primary act of the PSIS clinical message.
 */
export class DispenseNotificationPertinentInformation1 implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true"
  }

  templateId: codes.TemplateIdentifier = new codes.TemplateIdentifier("CSAB_RM-NPfITUK10.pertinentInformation")
  pertinentSupplyHeader: PertinentSupplyHeader

  constructor(pertinentSupplyHeader: PertinentSupplyHeader) {
    this.pertinentSupplyHeader = pertinentSupplyHeader
  }
}

/*
* A container for the collection of clinical statements that constitute Dispense Notification information
* to be available on PSIS.
*/
export class PertinentSupplyHeader implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "SBADM",
    moodCode: "EVN"
  }

  id: codes.Identifier<string>
  code: codes.SubstanceAdministrationSnCT
  effectiveTime: core.Null = core.Null.NOT_APPLICABLE
  author: prescription.Author

  constructor(id: codes.Identifier<string>) {
    this.id = id
    this.code = new codes.SubstanceAdministrationSnCT("225426007")
  }
}

/*
* An identifier of the Act Relationship that relates clinical statements directly to the focal act.
*/
export class DispenseNotificationPertinentInformation2 implements ElementCompact {
  _attributes: core.AttributeTypeCode = {
    typeCode: "PERT"
  }

  templateId: codes.TemplateIdentifier = new codes.TemplateIdentifier("CSAB_RM-NPfITUK10.pertinentInformation1")
  pertinentCareRecordElementCategory : parentPrescription.CareRecordElementCategory

  constructor(pertinentCareRecordElementCategory: parentPrescription.CareRecordElementCategory) {
    this.pertinentCareRecordElementCategory = pertinentCareRecordElementCategory
  }
}

/*
* An act relationship indicating that Dispense Notification sequentially follows the Prescription Release Event.
*/
export class SequelTo implements ElementCompact {
  _attributes: core.AttributeTypeCode = {
    typeCode: "SEQL"
  }

  priorPrescriptionReleaseEventRef: PriorPrescriptionReleaseEventRef

  constructor(priorPrescriptionReleaseEventRef: PriorPrescriptionReleaseEventRef) {
    this.priorPrescriptionReleaseEventRef = priorPrescriptionReleaseEventRef
  }
}

/*
* Details about the Patient Prescription Release Response or the Nominated Prescription Release Response
* that authorised the Dispense event.
*/
export class PriorPrescriptionReleaseEventRef implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "INFO",
    moodCode: "RQO"
  }

  id: codes.Identifier<string>

  constructor(id: codes.Identifier<string>) {
    this.id = id
  }
}
