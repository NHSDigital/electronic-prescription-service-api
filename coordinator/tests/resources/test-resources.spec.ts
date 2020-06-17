import * as fs from "fs"
import * as path from "path"
import {fhirPrescriptionMessage1} from "./test-resources"
import Ajv = require("ajv");

const validator = new Ajv()

const prepareSchemaStr = fs.readFileSync(path.join(__dirname, "../../schemas/Prepare.json"), "utf8")
const prepareSchema = JSON.parse(prepareSchemaStr)
const prepareSchemaValidator = validator.compile(prepareSchema)

const sendSchemaStr = fs.readFileSync(path.join(__dirname, "../../schemas/Send.json"), "utf8")
const sendSchema = JSON.parse(sendSchemaStr)
const sendSchemaValidator = validator.compile(sendSchema)

test("check example message 1 against JSON schema", () => {
    prepareSchemaValidator(fhirPrescriptionMessage1)
    expect(prepareSchemaValidator.errors).toBeNull()
})

test("check example message 1 against JSON schema", () => {
    sendSchemaValidator(fhirPrescriptionMessage1)
    expect(sendSchemaValidator.errors).toBeNull()
})
