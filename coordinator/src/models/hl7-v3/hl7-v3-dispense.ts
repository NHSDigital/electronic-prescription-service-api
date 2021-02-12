import * as core from "./hl7-v3-datatypes-core"
import * as codes from "./hl7-v3-datatypes-codes"
import {SendMessagePayloadAuthorAgentPerson} from "./hl7-v3-datatypes-core"

export class NominatedPrescriptionReleaseRequest {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "INFO",
    moodCode: "RQO"
  }
  id: codes.GlobalIdentifier
  effectiveTime: core.Timestamp
  author: SendMessagePayloadAuthorAgentPerson

  constructor(id: codes.GlobalIdentifier, effectiveTime: core.Timestamp) {
    this.id = id
    this.effectiveTime = effectiveTime
  }
}

export class NominatedPrescriptionReleaseRequestWrapper{
  NominatedPrescriptionReleaseRequest: NominatedPrescriptionReleaseRequest

  constructor(releaseRequest: NominatedPrescriptionReleaseRequest) {
    this.NominatedPrescriptionReleaseRequest = releaseRequest
  }
}
