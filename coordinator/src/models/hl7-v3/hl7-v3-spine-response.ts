import {AgentPerson, Patient} from "./hl7-v3-people-places"
import {GlobalIdentifier, CancellationResponseReason, ShortFormPrescriptionIdentifier} from "./hl7-v3-datatypes-codes"
import {Timestamp} from "./hl7-v3-datatypes-core"

export type acknowledgementCodes = "AA" | "AR"| "AE"

interface Code {
  _attributes: {
    code: string,
    displayName: string
  }
}

interface acknowledgementDetail {
  code: Code
}

export interface SyncMCCI {
  MCCI_IN010000UK13: {
    acknowledgement: {
      _attributes: {
        typeCode: acknowledgementCodes
      }
      acknowledgementDetail: acknowledgementDetail | Array<acknowledgementDetail>
    }
  }
}

interface Reason {
  "hl7:justifyingDetectedIssueEvent": {
    "hl7:code": Code
  }
}

export interface AsyncMCCI {
  "hl7:MCCI_IN010000UK13": {
    "hl7:acknowledgement": {
      _attributes: {
        typeCode: acknowledgementCodes
      }
    },
    "hl7:ControlActEvent": {
      "hl7:reason": Reason | Array<Reason>
    }
  }
}

export interface PORX50101 {
  "hl7:PORX_IN050101UK31": {
    "hl7:ControlActEvent": {
      "hl7:subject": hl7Subject
    }
    "hl7:acknowledgement": {
      _attributes: {
        typeCode: acknowledgementCodes
      }
    },
    "hl7:id": {
      _attributes: {
        root: string
      }
    }
  }
}

export interface hl7Subject {
  CancellationResponse: CancellationResponse
}

export interface CancellationResponse {
  id: GlobalIdentifier
  effectiveTime: Timestamp
  recordTarget: {
    Patient: Patient
  }
  author: {
    AgentPerson: AgentPerson
  }
  responsibleParty: {
    AgentPerson: AgentPerson
  }
  performer: {
    AgentPerson: AgentPerson
  }
  pertinentInformation1: PertinentInformation1
  pertinentInformation2: PertinentInformation2
  pertinentInformation3: PertinentInformation3
  pertinentInformation4: PertinentInformation4
}

export interface PertinentInformation1 {
  pertinentLineItemRef: {
    id: GlobalIdentifier
  }
}

export interface PertinentInformation2 {
  pertinentPrescriptionID: {
    value: ShortFormPrescriptionIdentifier
  }
}

export interface PertinentInformation3 {
  pertinentResponse: {
    value: CancellationResponseReason
  }
}

export interface PertinentInformation4 {
  pertinentCancellationRequestRef: {
    id: GlobalIdentifier
  }
}
