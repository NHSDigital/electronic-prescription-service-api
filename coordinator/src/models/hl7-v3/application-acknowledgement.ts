export enum AcknowledgementTypeCode {
  ACKNOWLEDGED = "AA",
  REJECTED = "AR",
  ERROR = "AE"
}

export interface SyncMCCI {
  MCCI_IN010000UK13: {
    acknowledgement: {
      _attributes: {
        typeCode: AcknowledgementTypeCode
      }
      acknowledgementDetail: acknowledgementDetail | Array<acknowledgementDetail>
    }
  }
}

interface acknowledgementDetail {
  code: Code
}

interface Code {
  _attributes: {
    code: string,
    displayName: string
  }
}

export interface AsyncMCCI {
  "hl7:MCCI_IN010000UK13": {
    "hl7:acknowledgement": {
      _attributes: {
        typeCode: AcknowledgementTypeCode
      }
    },
    "hl7:ControlActEvent": {
      "hl7:reason": Reason | Array<Reason>
    }
  }
}

interface Reason {
  "hl7:justifyingDetectedIssueEvent": {
    "hl7:code": Code
  }
}
