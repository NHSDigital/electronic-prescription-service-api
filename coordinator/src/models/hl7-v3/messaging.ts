import * as codes from "./codes"
import * as core from "./core"
import * as agent from "./agent-person"

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

  author: SendMessagePayloadAuthorPersonSds
  author1: SendMessagePayloadAuthorSystemSds
  reason?: SendMessagePayloadReason | Array<SendMessagePayloadReason>
  subject: T
}

abstract class SendMessagePayloadAuthor {
  _attributes: core.AttributeTypeCode = {
    typeCode: "AUT"
  }
}

export class SendMessagePayloadAuthorPersonSds extends SendMessagePayloadAuthor {
  AgentPersonSDS: AgentPersonSds

  constructor(agentPersonSds: AgentPersonSds) {
    super()
    this.AgentPersonSDS = agentPersonSds
  }
}

export class SendMessagePayloadAuthorSystemSds extends SendMessagePayloadAuthor {
  AgentSystemSDS: AgentSystemSds

  constructor(agentSystemSds: AgentSystemSds) {
    super()
    this.AgentSystemSDS = agentSystemSds
  }
}

export class SendMessagePayloadAuthorAgentPerson extends SendMessagePayloadAuthor {
  AgentPerson: agent.AgentPerson

  constructor(agentPerson: agent.AgentPerson) {
    super()
    this.AgentPerson = agentPerson
  }
}

abstract class SendMessagePayloadAgent {
  _attributes: core.AttributeClassCode = {
    classCode: "AGNT"
  }
}

export class AgentPersonSds extends SendMessagePayloadAgent {
  id: codes.SdsRoleProfileIdentifier
  agentPersonSDS: AgentPersonPersonSds
  part: AgentPersonPart
}

export class AgentPersonPersonSds {
  _attributes: core.AttributeClassCode & core.AttributeDeterminerCode = {
    classCode: "PSN",
    determinerCode: "INSTANCE"
  }

  id: codes.SdsUniqueIdentifier

  constructor(id: codes.SdsUniqueIdentifier) {
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

export class AgentSystemSds extends SendMessagePayloadAgent {
  agentSystemSDS: AgentSystemSystemSds

  constructor(systemSds: AgentSystemSystemSds) {
    super()
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

export class SendMessagePayloadReason {
  justifyingDetectedIssueEvent: JustifyingDetectedIssueEvent
}

export class JustifyingDetectedIssueEvent {
  code: codes.Code<string>
}
