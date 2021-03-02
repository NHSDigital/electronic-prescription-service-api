import * as core from "./core"
import * as codes from "./codes"
import {ElementCompact} from "xml-js"
import * as parentPrescription from "./parent-prescription"
import * as patient from "./patient"

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

  id: codes.GlobalIdentifier
  code: codes.SnomedCode
  effectiveTime: core.Timestamp
  typeId: codes.TypeIdentifier
  recordTarget: parentPrescription.RecordTarget
  // todo
  //primaryInformationRecipient:
  pertinentInformation1: parentPrescription.ParentPrescriptionPertinentInformation1
  pertinentInformation2: parentPrescription.ParentPrescriptionPertinentInformation2
  //replacementOf:
  //sequelTo:
  patient: patient.Patient
  //supplyHeader:
  careRecordElementCategory: parentPrescription.CareRecordElementCategory
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
}
