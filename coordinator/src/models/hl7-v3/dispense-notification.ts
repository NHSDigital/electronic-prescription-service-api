import * as core from "./core"
import * as codes from "./codes"
import {ElementCompact} from "xml-js"
import * as parentPrescription from "./parent-prescription"
import * as organisation from "./organization"

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
  pertinentInformation1: DispenseNotificationPertinentInformation1
  //pertinentInformation2: parentPrescription.ParentPrescriptionPertinentInformation2
  //replacementOf:
  //sequelTo:
  //patient: patient.Patient
  //supplyHeader:
  //careRecordElementCategory: parentPrescription.CareRecordElementCategory
  //messageRef:
  //prescriptionReleaseEventRef:
  //suppliedLineItem:
  //prescriptionStatus:
  //prescriptionID
  //originalPrescriptionRef
  //supplyHeaderRef
  //actRef
  //requestedManufacturedProduct
  //suppliedLineItemQuantity
  //supplyRequest
  //runningTotal
  //nonDispensingReason
  //itemStatus
  //intendedMedicationAdministrationRef
  //originalItemRef
  //suppliedLineItemRef
  //requestedMaterial
  //suppliedManufacturedProduct
  //additionalInstructions
  //supplyInstructions
  //suppliedMaterial

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

/**
 * An act relationship that associates the DispenseNotification focal act with
 * SupplyHeader - the primary act of the PSIS clinical message.
 */
export class DispenseNotificationPertinentInformation1 implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true"
  }

  templateId: codes.TemplateIdentifier = new codes.TemplateIdentifier("CSAB_RM-NPfITUK10.pertinentInformation")
  // todo: confirm if this has been deprecated
  //pertinentSupplyHeader: PertinentSupplyHeader

  // constructor(pertinentSupplyHeader: PertinentSupplyHeader) {
  //   this.pertinentSupplyHeader = pertinentSupplyHeader
  // }
}
