const fs = require("fs")
const path = require("path")
const Ajv = require("ajv");
const $RefParser = require("@apidevtools/json-schema-ref-parser");

const validator = new Ajv()

//TODO - either have a single validator, or have two schemas
const prepareSchemaValidator = createSchemaValidator("../../specification/components/schemas/Bundle.yaml")
const sendSchemaValidator = createSchemaValidator("../../specification/components/schemas/Bundle.yaml")

async function createSchemaValidator(relativePath) {
  const schema = await $RefParser.dereference(path.join(__dirname, relativePath))
  return validator.compile(schema)
}

function testSchema(schemaValidatorPromise, relativePath) {
  return async () => {
    const messageStr = fs.readFileSync(path.join(__dirname, relativePath), "utf8")
    const message = JSON.parse(messageStr)
    const schemaValidator = await schemaValidatorPromise
    const valid = schemaValidator(message)
    if (schemaValidator.errors) {
      console.log(schemaValidator.errors)
    }
    expect(valid).toBeTruthy()
  }
}

/**
 * If these tests fail due to missing files, make sure to run "make build-sandbox" first.
 */

test("PrepareSuccessRequest conforms to the JSON spec", testSchema(prepareSchemaValidator, "../mocks/PrepareSuccessRequest.json"))
test("SendSuccessRequest conforms to the JSON spec", testSchema(sendSchemaValidator, "../mocks/SendSuccessRequest.json"))
