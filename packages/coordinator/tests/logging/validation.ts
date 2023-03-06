import {PayloadIdentifiers} from "../../src/routes/logging"

const UUID_REGEX = /[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}/
const NHS_NUMBER_REGEX = /^\d{10}$/
const ODS_CODE_REGEX = /^[0-9a-zA-Z-]+$/
const PRESCRIPTION_ID_SHORT_REGEX = /^[a-zA-Z0-9-+]{19,20}$/

type PayloadIdentifiersValidationRules = {
  [Property in keyof PayloadIdentifiers]: RegExp | string
}

export class PayloadIdentifiersValidator {
    private validator: PayloadIdentifiersValidationRules

    constructor() {
      this.defaultRules()
    }

    validate(payloadIdentifiers: PayloadIdentifiers): void {
      Object.entries(payloadIdentifiers).forEach(([key, value]) => {
        // cast the propertyName to a Property of PayloadIdentifiers
        // this allows to dynamically validate all the properties w/o requiring new expect statements
        const propertyName = key as keyof PayloadIdentifiers
        const expected = this.validator[propertyName]

        expect(
          value,
          `Unexpected value for '${propertyName}': ${value} != ${expected}` // custom error message
        ).toMatch(expected)
      })
    }

    validateArray(payloadIdentifiersArray: Array<PayloadIdentifiers>): void {
      payloadIdentifiersArray.forEach(payloadIdentifiers => this.validate(payloadIdentifiers))
    }

    private defaultRules(): void {
      this.validator = {
        payloadIdentifier: UUID_REGEX,
        patientNhsNumber: NHS_NUMBER_REGEX,
        prescriptionShortFormId: PRESCRIPTION_ID_SHORT_REGEX,
        senderOdsCode: ODS_CODE_REGEX
      }
    }

    payloadIdentifier(pattern?: string | RegExp): PayloadIdentifiersValidator {
      this.validator.payloadIdentifier = pattern ?? UUID_REGEX
      return this
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
