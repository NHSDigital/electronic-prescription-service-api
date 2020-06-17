const fs = require("fs")
const path = require("path")
const Ajv = require("ajv");

const validator = new Ajv()

const prepareSchemaStr = fs.readFileSync(path.join(__dirname, "../schemas/Prepare.json"), "utf8")
const prepareSchema = JSON.parse(prepareSchemaStr)
const prepareSchemaValidator = validator.compile(prepareSchema)

const sendSchemaStr = fs.readFileSync(path.join(__dirname, "../schemas/Send.json"), "utf8")
const sendSchema = JSON.parse(sendSchemaStr)
const sendSchemaValidator = validator.compile(sendSchema)

function testSchema(schemaValidator, relativePath) {
  return () => {
    const prepareRequestStr = fs.readFileSync(path.join(__dirname, relativePath), "utf8")
    const prepareRequest = JSON.parse(prepareRequestStr)
    const valid = schemaValidator(prepareRequest)
    if (schemaValidator.errors) {
      console.log(schemaValidator.errors)
    }
    expect(valid).toBeTruthy()
  }
}

test("PrepareSuccessRequest conforms to the JSON spec", testSchema(prepareSchemaValidator, "../mocks/PrepareSuccessRequest.json"))
test("SendSuccessRequest conforms to the JSON spec", testSchema(sendSchemaValidator, "../mocks/SendSuccessRequest.json"))
