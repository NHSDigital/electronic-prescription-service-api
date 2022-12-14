import * as agentPerson from "./agent-person"
import * as codes from "./codes"
import * as core from "./core"
import * as patient from "./patient"

export interface CancellationResponseRoot {
  CancellationResponse: CancellationResponse
}

export interface CancellationResponse {
  id: codes.GlobalIdentifier
  effectiveTime: core.Timestamp
  recordTarget: {
    Patient: patient.Patient
  }
  author: {
    AgentPerson: agentPerson.AgentPerson
  }
  responsibleParty: {
    AgentPerson: agentPerson.AgentPerson
  }
  performer: {
    AgentPerson: agentPerson.AgentPerson
  }
  pertinentInformation1: CancellationResponsePertinentInformation1
  pertinentInformation2: CancellationResponsePertinentInformation2
  pertinentInformation3: CancellationResponsePertinentInformation3
  pertinentInformation4: CancellationResponsePertinentInformation4
}

export interface CancellationResponsePertinentInformation1 {
  pertinentLineItemRef: {
    id: codes.GlobalIdentifier
  }
}

export interface CancellationResponsePertinentInformation2 {
  pertinentPrescriptionID: {
    value: codes.ShortFormPrescriptionIdentifier
  }
}

export interface CancellationResponsePertinentInformation3 {
  pertinentResponse: {
    value: codes.CancellationResponseReason
  }
}

export interface CancellationResponsePertinentInformation4 {
  pertinentCancellationRequestRef: {
    id: codes.GlobalIdentifier
  }
}
