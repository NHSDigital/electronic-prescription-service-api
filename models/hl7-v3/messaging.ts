import * as codes from "./codes"
import * as core from "./core"
import * as agentPerson from "./agent-person"

export interface WrapperRoot<T> {
  [key: string]: SendMessagePayload<T>
}

export class SendMessagePayload<T> {
  id: codes.GlobalIdentifier
  creationTime: core.Timestamp
  versionCode: codes.Hl7StandardVersionCode
  interactionId: codes.Hl7InteractionIdentifier
  processingCode: codes.ProcessingId
  processingModeCode: codes.ProcessingMode
  acceptAckCode: codes.AcceptAckCode
  acknowledgement?: Acknowledgement
  communicationFunctionRcv: CommunicationFunction
  communicationFunctionSnd: CommunicationFunction
  ControlActEvent: ControlActEvent<T>

  constructor(id: codes.GlobalIdentifier, creationTime: core.Timestamp, interactionId: codes.Hl7InteractionIdentifier) {
    this.id = id
    this.creationTime = creationTime
    this.versionCode = codes.Hl7StandardVersionCode.V3_NPFIT_4_2_00
    this.interactionId = interactionId
    this.processingCode = codes.ProcessingId.PRODUCTION
    this.processingModeCode = codes.ProcessingMode.ONLINE
    this.acceptAckCode = codes.AcceptAckCode.NEVER
  }
}

export class Acknowledgement {
  _attributes: {
    typeCode: AcknowledgementTypeCode
  }
  acknowledgementDetail?: AcknowledgementDetail | Array<AcknowledgementDetail>
}

export enum AcknowledgementTypeCode {
  ACKNOWLEDGED = "AA",
  REJECTED = "AR",
  ERROR = "AE"
}

export class AcknowledgementDetail {
  code: codes.AcknowledgementExceptionCode
}

export class CommunicationFunction {
  device: Device

  constructor(device: Device) {
    this.device = device
  }
}

export class Device {
  _attributes: core.AttributeClassCode & core.AttributeDeterminerCode = {
    classCode: "DEV",
    determinerCode: "INSTANCE"
  }

  id: codes.AccreditedSystemIdentifier

  constructor(id: codes.AccreditedSystemIdentifier) {
    this.id = id
  }
}

export class ControlActEvent<T> {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "CACT",
    moodCode: "EVN"
  }

  author: agentPerson.AuthorPersonSds
  author1: agentPerson.AuthorSystemSds
  reason?: SendMessagePayloadReason | Array<SendMessagePayloadReason>
  subject: T
}

export class SendMessagePayloadReason {
  justifyingDetectedIssueEvent: JustifyingDetectedIssueEvent
}

export class JustifyingDetectedIssueEvent {
  code: codes.Code<string>
}
