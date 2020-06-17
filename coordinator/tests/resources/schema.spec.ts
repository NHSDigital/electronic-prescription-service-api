import * as fs from "fs"
import * as path from "path"
import Ajv = require("ajv");

const validator = new Ajv()

const prepareSchemaStr = fs.readFileSync(path.join(__dirname, "../../schemas/Prepare.json"), "utf8")
const prepareSchema = JSON.parse(prepareSchemaStr)
const prepareSchemaValidator = validator.compile(prepareSchema)

const sendSchemaStr = fs.readFileSync(path.join(__dirname, "../../schemas/Send.json"), "utf8")
const sendSchema = JSON.parse(sendSchemaStr)
const sendSchemaValidator = validator.compile(sendSchema)

function testSchema(schemaValidator: Ajv.ValidateFunction, relativePath: string) {
    return () => {
        const messageStr = fs.readFileSync(path.join(__dirname, relativePath), "utf8")
        const message = JSON.parse(messageStr)
        const valid = schemaValidator(message)
        if (schemaValidator.errors) {
            console.log(schemaValidator.errors)
        }
        expect(valid).toBeTruthy()
    }
}

test("check example message 1 against Prepare JSON schema", testSchema(prepareSchemaValidator, "parent-prescription-1/fhir-message.json"))
test("check example message 1 against Send JSON schema", testSchema(sendSchemaValidator, "parent-prescription-1/fhir-message.json"))
