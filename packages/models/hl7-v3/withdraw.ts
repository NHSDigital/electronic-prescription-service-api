import * as core from "./core"
import * as codes from "./codes"
import * as prescription from "./prescription"
import * as agentPerson from "./agent-person"
import * as patient from "./patient"

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
  recordTarget: patient.RecordTargetReference
  author: agentPerson.AuthorPersonSds
  pertinentInformation1: EtpWithdrawPertinentInformation1
  pertinentInformation2: EtpWithdrawPertinentInformation2
  pertinentInformation3: EtpWithdrawPertinentInformation3
  pertinentInformation4: EtpWithdrawPertinentInformation4
  pertinentInformation5: EtpWithdrawPertinentInformation5

  constructor(id: codes.GlobalIdentifier, effectiveTime: core.Timestamp) {
    this.id = id
    this.effectiveTime = effectiveTime
  }
}

export class EtpWithdrawPertinentInformation1 {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  pertinentRepeatInstanceInfo: RepeatInstanceInfo

  constructor(repeatInstanceInfo: RepeatInstanceInfo) {
    this.pertinentRepeatInstanceInfo = repeatInstanceInfo
  }
}

export class RepeatInstanceInfo extends prescription.PrescriptionAnnotation {
  code: codes.PrescriptionAnnotationCode
  value: core.NumericValue

  constructor(code: string, repeatInstance: string) {
    super(new codes.PrescriptionAnnotationCode("RPI"))
    this.code = new codes.PrescriptionAnnotationCode(code)
    this.value = new core.NumericValue(repeatInstance)
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

