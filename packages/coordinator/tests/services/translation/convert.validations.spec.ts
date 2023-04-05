import * as TestResources from "../../resources/test-resources"
import {fhir} from "@models"
import {convert} from "../../convert"

import validator from "xsd-schema-validator"
import * as xml from "../../../src/services/serialisation/xml"

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

  console.log("VALIDATING")
  let validationResult: ValidationResult
  validator.validateXML(xmlString + "X", schemaPath, (err, result) => {
    console.log("CALLBACK")
    validationResult = {
      result: result,
      err: err
    }
  })
  console.log("VALIDATED")

  console.log("SLEEPY TIME")
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
  await sleep(1000)
  console.log("WAKEY WAKEY")

  while (validationResult === undefined) {
    console.log("UNDEFINED...")
    await sleep(1000)
  }
  console.log("DEFINED!!!")

  console.log("RETURNING")
  return validationResult
}

test("proof", async () => {
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
  console.log("WAITING")
  await sleep(3000)
  console.log("DONE")
  expect(true).toBeTruthy()
})

describe("Validation tests:", () => {
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2022, 1, 1))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  test.each([TestResources.convertSuccessClaimExamples[0]])(
    "%s message should validate against Claim BSA schema.",
    async (testname: string, request: fhir.Resource) => {
      const result = await convert(request)
      const schemaPath = TestResources.dispensingValidationSchema.Claim

      console.log("AWAITING VALIDATE")
      const validationResult = await validate(result.message, schemaPath)
      console.log("VALIDATE AWAITED")

      console.log("ASSERTING")
      expect(validationResult.result.valid).toBeTruthy()
    }, 20000
  )

  // test.each([TestResources.convertSuccessDispenseExamples[0]])(
  //   "%s message should validate against DispenseNotification BSA schema.",
  //   async (testname: string, request: fhir.Resource) => {
  //     const result = await convert(request)

  //     const schemaPath = TestResources.dispensingValidationSchema.DispenseNotification
  //     const isValid = validate(result.message, schemaPath)

  //     expect(isValid).toBeTruthy()
  //   }
  // )

  // test.each([TestResources.convertSuccessReleaseExamples[0]])(
  //   "%s message should validate against Release BSA schema.",
  //   async (testname: string, request: fhir.Resource) => {
  //     const result = await convert(request)

  //     const nominatedSchemaPath = TestResources.dispensingValidationSchema.NominatedRelease
  //     const patientSchemaPath = TestResources.dispensingValidationSchema.PatientRelease
  //     expect(
  //       [
  //         validate(result.message, nominatedSchemaPath),
  //         validate(result.message, patientSchemaPath)
  //       ].some((v) => v)
  //     ).toBeTruthy()
  //   }
  // )

  // test.each([TestResources.convertSuccessReturnExamples[0]])(
  //   "%s message should validate against Return BSA schema.",
  //   async (testname: string, request: fhir.Resource) => {
  //     const result = await convert(request)

  //     const schemaPath = TestResources.dispensingValidationSchema.Return
  //     const isValid = validate(result.message, schemaPath)

  //     expect(isValid).toBeTruthy()
  //   }
  // )

  // test.each([TestResources.convertSuccessWithdrawExamples[0]])(
  //   "%s message should validate against Withdraw BSA schema.",
  //   async (testname: string, request: fhir.Resource) => {
  //     const result = await convert(request)

  //     const schemaPath = TestResources.dispensingValidationSchema.Withdraw
  //     const isValid = validate(result.message, schemaPath)

  //     expect(isValid).toBeTruthy()
  //   }
  // )
})
