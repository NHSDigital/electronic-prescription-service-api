import {PayloadIdentifiers} from "../../src/routes/logging"

const NHS_NUMBER_REGEX = /^[\d]{10}$/
const ODS_CODE_REGEX = /^[0-9a-zA-Z-]+$/
const PRESCRIPTION_ID_SHORT_REGEX = /^[a-zA-Z0-9-+]{19,20}$/

type PayloadIdentifiersValidationRules = {
    [Property in keyof PayloadIdentifiers]: RegExp | string
  }

export class PayloadIdentifiersValidator {
    private readonly NOT_PROVIDED = "NotProvided"
    private validator: PayloadIdentifiersValidationRules

    constructor() {
      this.defaultRules()
    }

    validate(payloadIdentifiers: PayloadIdentifiers): void {
      expect(payloadIdentifiers.patientNhsNumber).toMatch(this.validator.patientNhsNumber)
      expect(payloadIdentifiers.senderOdsCode).toMatch(this.validator.senderOdsCode)
      expect(payloadIdentifiers.prescriptionShortFormId).toMatch(this.validator.prescriptionShortFormId)
    }

    validateArray(payloadIdentifiersArray: Array<PayloadIdentifiers>): void {
      payloadIdentifiersArray.forEach(payloadIdentifiers => this.validate(payloadIdentifiers))
    }

    private defaultRules(): void {
      this.validator = {
        patientNhsNumber: NHS_NUMBER_REGEX,
        prescriptionShortFormId: PRESCRIPTION_ID_SHORT_REGEX,
        senderOdsCode: ODS_CODE_REGEX
      }
    }

    nhsNumber(pattern?: string | RegExp): PayloadIdentifiersValidator {
      this.validator.patientNhsNumber = pattern ?? NHS_NUMBER_REGEX
      return this
    }

    senderOdsCode(pattern?: string | RegExp): PayloadIdentifiersValidator {
      this.validator.senderOdsCode = pattern ?? ODS_CODE_REGEX
      return this
    }

    prescriptionShortFormId(pattern?: string | RegExp): PayloadIdentifiersValidator {
      this.validator.prescriptionShortFormId = pattern ?? PRESCRIPTION_ID_SHORT_REGEX
      return this
    }
}
