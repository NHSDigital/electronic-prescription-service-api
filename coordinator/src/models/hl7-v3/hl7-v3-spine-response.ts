import {Patient} from "./hl7-v3-people-places"

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

export interface SpineCancellationResponse {
  "hl7:PORX_IN050101UK31": {
    "hl7:ControlActEvent": {
      "hl7:subject": {
        CancellationResponse: CancellationResponse
      }
    }
  }
}

export interface CancellationResponse {
  effectiveTime: {
    _attributes: {
      value: string
    }
  }
  recordTarget: {
    Patient: Patient
  }
  pertinentInformation3: PertinentInformation3
}

export interface PertinentInformation3 {
  pertinentResponse: {
    value: {
      _attributes: {
        code: string
        displayName: string
      }
    }
  }
}
