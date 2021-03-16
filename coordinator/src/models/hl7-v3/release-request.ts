import * as core from "./core"
import * as codes from "./codes"
import * as agentPerson from "./agent-person"

export class NominatedPrescriptionReleaseRequest {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "INFO",
    moodCode: "RQO"
  }
  id: codes.GlobalIdentifier
  effectiveTime: core.Timestamp
  author: agentPerson.Author

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
