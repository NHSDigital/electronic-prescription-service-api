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
  "hl7:acknowledgement": {
    _attributes: {
      typeCode: acknowledgementCodes
    }
  },
  "hl7:MCCI_IN010000UK13": {
    "hl7:ControlActEvent": {
      "hl7:reason": Reason | Array<Reason>
    }
  }
}
