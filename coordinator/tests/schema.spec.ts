import * as path from "path"
import * as TestResources from "./resources/test-resources"
import {Bundle} from "../src/model/fhir-resources"
import * as LosslessJson from "lossless-json"
import Ajv = require("ajv");
import $RefParser = require("@apidevtools/json-schema-ref-parser");

const validator = new Ajv()

const schemaValidatorPromise = createSchemaValidator("../../models/schemas/Bundle.yaml")

async function createSchemaValidator(relativePath: string) {
  const schema = await $RefParser.dereference(path.join(__dirname, relativePath))
  return validator.compile(schema)
}

async function schemaTest(losslessMessage: Bundle) {
  const schemaValidator = await schemaValidatorPromise
  const message = JSON.parse(LosslessJson.stringify(losslessMessage))
  const valid = schemaValidator(message)
  if (schemaValidator.errors) {
    console.log(JSON.stringify(schemaValidator.errors, null, 2))
  }
  expect(valid).toBeTruthy()
}

describe("Unsigned messages", () => {
  const unsignedCases = TestResources.all.map(example => [example.description, example.fhirMessageUnsigned])

  test.each(unsignedCases)("%s passes schema validation", async (desc: string, losslessMessage: Bundle) => {
    await schemaTest(losslessMessage)
  })
})

describe("Signed messages", () => {
  const signedCases = TestResources.all.map(example => [example.description, example.fhirMessageUnsigned])

  test.each(signedCases)("%s passes schema validation", async (desc: string, losslessMessage: Bundle) => {
    await schemaTest(losslessMessage)
  })
})
