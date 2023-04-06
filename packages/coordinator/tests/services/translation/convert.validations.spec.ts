import * as TestResources from "../../resources/test-resources"
import {fhir} from "@models"
import {convert} from "../../convert"

import validator from "xsd-schema-validator"
import * as xml from "../../../src/services/serialisation/xml"

import * as fs from "fs"

type Result = {
  valid: boolean;
  messages: Array<string>;
  result: string;
};

type ValidationResult = {
  result: Result;
  err: Error;
}

async function validate(xmlString: string, schemaPath: string, printXml=false): Promise<ValidationResult> {
  if (printXml) {
    console.log(xml.writeXmlStringPretty(xml.readXml(xmlString)))
  }

  return new Promise((resolve) => validator.validateXML(xmlString, schemaPath, (err, result) => {
    resolve({
      result: result,
      err: err
    })
  }))
}

describe("Validation tests:", () => {
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2022, 1, 1))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  test.each(TestResources.convertSuccessClaimExamples)(
    "%s message should validate against Claim BSA schema.",
    async (testname: string, request: fhir.Resource) => {
      const converted = await convert(request)
      const schemaPath = TestResources.dispensingValidationSchema.Claim

      const {result, err} = await validate(converted.message, schemaPath)

      expect(err).toBeNull()
      expect(result.valid).toBeTruthy()
    }
  )

  test.each(TestResources.convertSuccessDispenseExamples)(
    "%s message should validate against DispenseNotification BSA schema.",
    async (testname: string, request: fhir.Resource) => {
      const converted = await convert(request)
      const schemaPath = TestResources.dispensingValidationSchema.DispenseNotification

      const {result, err} = await validate(converted.message, schemaPath)

      expect(err).toBeNull()
      expect(result.valid).toBeTruthy()
    }
  )

  test.each([TestResources.convertSuccessReleaseExamples[0]])(
    "%s message should validate against NominatedRelease BSA schema.",
    async (testname: string, request: fhir.Resource) => {
      const converted = await convert(request)
      const schemaPath = TestResources.dispensingValidationSchema.NominatedRelease

      const {result, err} = await validate(converted.message, schemaPath)

      expect(err).toBeNull()
      expect(result.valid).toBeTruthy()
    }
  )

  test.each([TestResources.convertSuccessReleaseExamples[0]])(
    "%s message should validate against PatientRelease BSA schema.",
    async (testname: string, request: fhir.Resource) => {
      const converted = await convert(request)
      const schemaPath = TestResources.dispensingValidationSchema.PatientRelease

      const {result, err} = await validate(converted.message, schemaPath)

      expect(err).toBeNull()
      expect(result.valid).toBeTruthy()
    }
  )

  test.each([TestResources.convertSuccessReturnExamples[0]])(
    "%s message should validate against Return BSA schema.",
    async (testname: string, request: fhir.Resource) => {
      const converted = await convert(request)
      const schemaPath = TestResources.dispensingValidationSchema.Return

      const {result, err} = await validate(converted.message, schemaPath)

      expect(err).toBeNull()
      expect(result.valid).toBeTruthy()
    }
  )

  test.each(TestResources.convertSuccessWithdrawExamples)(
    "%s message should validate against Withdraw BSA schema.",
    async (testname: string, request: fhir.Resource) => {
      const converted = await convert(request)
      const schemaPath = TestResources.dispensingValidationSchema.Withdraw

      const {result, err} = await validate(converted.message, schemaPath)

      expect(err).toBeNull()
      expect(result.valid).toBeTruthy()
    }
  )

  test("read xml", async () => {
    const message = fs.readFileSync(
      "packages/coordinator/tests/services/translation/test.xml", "utf-8"
    )
    const schemaPath = TestResources.dispensingValidationSchema.Withdraw

    const {result, err} = await validate(message, schemaPath, true)

    expect(err).toBeNull()
    expect(result.valid).toBeTruthy()
  })
})
