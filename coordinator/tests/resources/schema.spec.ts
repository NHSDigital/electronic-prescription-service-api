import * as fs from "fs"
import * as path from "path"
import Ajv = require("ajv")
import $RefParser = require("@apidevtools/json-schema-ref-parser");

const validator = new Ajv()

//TODO - either have a single validator, or have two schemas
const prepareSchemaValidator = createSchemaValidator("../../../models/dist/schemas/Bundle.yaml")
const sendSchemaValidator = createSchemaValidator("../../../models/dist/schemas/Bundle.yaml")

async function createSchemaValidator(relativePath: string) {
    const schema = await $RefParser.dereference(path.join(__dirname, relativePath))
    return validator.compile(schema)
}

function testSchema(schemaValidatorPromise: Promise<Ajv.ValidateFunction>, relativePath: string) {
    return async () => {
        const messageStr = fs.readFileSync(path.join(__dirname, relativePath), "utf8")
        const message = JSON.parse(messageStr)
        const schemaValidator = await schemaValidatorPromise
        const valid = schemaValidator(message)
        if (!valid) console.log(schemaValidator.errors);
        if (schemaValidator.errors) {
            console.log(schemaValidator.errors)
        }
        expect(valid).toBeTruthy()
    }
}

test("check example message 1 against Prepare JSON schema", testSchema(prepareSchemaValidator, "parent-prescription-1/fhir-message.json"))
test("check example message 1 against Send JSON schema", testSchema(sendSchemaValidator, "parent-prescription-1/fhir-message.json"))
test("check example message 2 against Prepare JSON schema", testSchema(prepareSchemaValidator, "parent-prescription-2/fhir-message.json"))
test("check example message 2 against Send JSON schema", testSchema(sendSchemaValidator, "parent-prescription-2/fhir-message.json"))
