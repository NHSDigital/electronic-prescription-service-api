import * as core from "./core"
import * as codes from "./codes"
import * as agentPerson from "./agent-person"
import * as prescription from "./prescription"

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

export class PatientPrescriptionReleaseRequest {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "INFO",
    moodCode: "RQO"
  }
  id: codes.GlobalIdentifier
  effectiveTime: core.Timestamp
  author: agentPerson.Author
  pertinentInformation: PatientPrescriptionReleaseRequestPertinentInformation

  constructor(id: codes.GlobalIdentifier, effectiveTime: core.Timestamp) {
    this.id = id
    this.effectiveTime = effectiveTime
  }
}

export class PatientPrescriptionReleaseRequestPertinentInformation {
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

export class PatientPrescriptionReleaseRequestWrapper{
  PatientPrescriptionReleaseRequest: PatientPrescriptionReleaseRequest

  constructor(releaseRequest: PatientPrescriptionReleaseRequest) {
    this.PatientPrescriptionReleaseRequest = releaseRequest
  }
}
