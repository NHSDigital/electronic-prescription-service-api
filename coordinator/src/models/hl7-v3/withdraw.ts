import * as core from "./core"
import * as codes from "./codes"
import * as messaging from "./messaging"
import * as dispenseNotification from "./dispense-notification"
import * as prescription from "./prescription"

export class EtpWithdrawRoot {
  ETPWithdraw: EtpWithdraw

  constructor(etpWithdraw: EtpWithdraw) {
    this.ETPWithdraw = etpWithdraw
  }
}

export class EtpWithdraw {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "ALRT",
    moodCode: "EVN"
  }

  id: codes.GlobalIdentifier
  effectiveTime: core.Timestamp
  //TODO - rename and move to a common file
  recordTarget: dispenseNotification.DispenseRecordTarget
  author: messaging.SendMessagePayloadAuthorAgentPerson
  pertinentInformation3: EtpWithdrawPertinentInformation3
  pertinentInformation2: EtpWithdrawPertinentInformation2
  pertinentInformation5: EtpWithdrawPertinentInformation5
  pertinentInformation4: EtpWithdrawPertinentInformation4

  constructor(id: codes.GlobalIdentifier, effectiveTime: core.Timestamp) {
    this.id = id
    this.effectiveTime = effectiveTime
  }
}

export class EtpWithdrawPertinentInformation3 {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "false"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  pertinentWithdrawID: WithdrawId

  constructor(withdrawId: WithdrawId) {
    this.pertinentWithdrawID = withdrawId
  }
}

export class WithdrawId extends prescription.PrescriptionAnnotation {
  value: codes.ShortFormPrescriptionIdentifier

  constructor(id: string) {
    super(new codes.PrescriptionAnnotationCode("WID"))
    this.value = new codes.ShortFormPrescriptionIdentifier(id)
  }
}

export class EtpWithdrawPertinentInformation2 {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  pertinentWithdrawType: WithdrawType

  constructor(withdrawType: WithdrawType) {
    this.pertinentWithdrawType = withdrawType
  }
}

export class WithdrawType extends prescription.PrescriptionAnnotation {
  value: codes.PrescriptionWithdrawType

  constructor(code: string, desc: string) {
    super(new codes.PrescriptionAnnotationCode("PWT"))
    this.value = new codes.PrescriptionWithdrawType(code, desc)
  }
}

export class EtpWithdrawPertinentInformation5 {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  pertinentWithdrawReason: WithdrawReason

  constructor(withdrawReason: WithdrawReason) {
    this.pertinentWithdrawReason = withdrawReason
  }
}

export class WithdrawReason extends prescription.PrescriptionAnnotation {
  value: codes.PrescriptionWithdrawReason

  constructor(code: string, desc: string) {
    super(new codes.PrescriptionAnnotationCode("PWR"))
    this.value = new codes.PrescriptionWithdrawReason(code, desc)
  }
}

export class EtpWithdrawPertinentInformation4 {
  _attributes: core.AttributeTypeCode & core.AttributeInversionInd & core.AttributeNegationInd = {
    typeCode: "PERT",
    inversionInd: "false",
    negationInd: "false"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(true)
  pertinentDispenseNotificationRef: DispenseNotificationRef

  constructor(dispenseNotificationRef: DispenseNotificationRef) {
    this.pertinentDispenseNotificationRef = dispenseNotificationRef
  }
}

export class DispenseNotificationRef {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "INFO",
    moodCode: "EVN"
  }

  id: codes.GlobalIdentifier

  constructor(id: string) {
    this.id = new codes.GlobalIdentifier(id)
  }
}
