import * as core from "./core"
import * as codes from "./codes"
import * as prescription from "./prescription"
import * as agentPerson from "./agent-person"

export class DispenseProposalReturnRoot {
  DispenseProposalReturn: DispenseProposalReturn

  constructor(dispenseProposalReturn: DispenseProposalReturn) {
    this.DispenseProposalReturn = dispenseProposalReturn
  }
}

export class DispenseProposalReturn {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "INFO",
    moodCode: "EVN"
  }

  readonly id: codes.GlobalIdentifier
  readonly effectiveTime: core.Timestamp
  readonly author: agentPerson.Author
  readonly pertinentInformation1: DispenseProposalReturnPertinentInformation1
  readonly pertinentInformation3: DispenseProposalReturnPertinentInformation3
  readonly reversalOf: DispenseProposalReturnReversalOf

  constructor(id: codes.GlobalIdentifier,
    effectiveTime: core.Timestamp,
    author: agentPerson.Author,
    pertinentInformation1: DispenseProposalReturnPertinentInformation1,
    pertinentInformation3: DispenseProposalReturnPertinentInformation3,
    reversalOf: DispenseProposalReturnReversalOf ) {
    this.id = id
    this.effectiveTime = effectiveTime
    this.author = author
    this.pertinentInformation1 = pertinentInformation1
    this.pertinentInformation3 = pertinentInformation3
    this.reversalOf = reversalOf
  }

}

export class DispenseProposalReturnRepeat extends DispenseProposalReturn {

  readonly pertinentInformation2: DispenseProposalReturnPertinentInformation2
  readonly pertinentRepeatInstanceInfo : RepeatInstanceInfo

  constructor(id: codes.GlobalIdentifier,
    effectiveTime: core.Timestamp,
    author: agentPerson.Author,
    pertinentInformation1: DispenseProposalReturnPertinentInformation1,
    pertinentInformation3: DispenseProposalReturnPertinentInformation3,
    reversalOf: DispenseProposalReturnReversalOf,
    repeatPertinentInformation2: DispenseProposalReturnPertinentInformation2
  ) {
    super(id,
      effectiveTime,
      author,
      pertinentInformation1,
      pertinentInformation3,
      reversalOf)
    this.pertinentInformation2 = repeatPertinentInformation2
  }

}

export class RepeatInstanceInfo {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "OBS",
    moodCode: "EVN"
  }
  readonly value : core.NumericValue
  readonly code : codes.PrescriptionAnnotationCode

  constructor(value: number, code: string) {
    this.value = new core.NumericValue(value.toString())
    this.code = new codes.PrescriptionAnnotationCode(code)
  }
}

export class DispenseProposalReturnPertinentInformation1 {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  pertinentPrescriptionID: prescription.PrescriptionId

  constructor(prescriptionId: prescription.PrescriptionId) {
    this.pertinentPrescriptionID = prescriptionId
  }
}

export class DispenseProposalReturnPertinentInformation2 {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true"
  }
  readonly pertinentRepeatInstanceInfo: RepeatInstanceInfo
  seperatableInd: core.BooleanValue = new core.BooleanValue(false)

  constructor(repeatInfo : RepeatInstanceInfo) {
    this.pertinentRepeatInstanceInfo = repeatInfo
  }
}

export class DispenseProposalReturnPertinentInformation3 {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "false"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  pertinentReturnReason: ReturnReason

  constructor(returnReason: ReturnReason) {
    this.pertinentReturnReason = returnReason
  }
}

export class ReturnReason extends prescription.PrescriptionAnnotation {
  value: codes.ReturnReasonCode

  constructor(value: codes.ReturnReasonCode) {
    super(new codes.PrescriptionAnnotationCode("RR"))
    this.value = value
  }
}

export class DispenseProposalReturnReversalOf {
  _attributes: core.AttributeTypeCode & core.AttributeInversionInd & core.AttributeNegationInd = {
    typeCode: "REV",
    inversionInd: "true",
    negationInd: "false"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(true)
  priorPrescriptionReleaseResponseRef: PrescriptionReleaseResponseRef

  constructor(prescriptionReleaseResponseRef: PrescriptionReleaseResponseRef) {
    this.priorPrescriptionReleaseResponseRef = prescriptionReleaseResponseRef
  }
}

export class PrescriptionReleaseResponseRef {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "INFO",
    moodCode: "EVN"
  }

  id: codes.GlobalIdentifier

  constructor(value: string) {
    this.id = new codes.GlobalIdentifier(value)
  }
}
