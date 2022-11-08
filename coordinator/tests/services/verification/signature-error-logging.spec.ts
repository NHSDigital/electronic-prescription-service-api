import Hapi from "@hapi/hapi"
import {logVerificationErrors} from "../../../src/routes/dispense/verify-signature"

let server: Hapi.Server

describe("logVerificationErrors...", () => {
  test("builds a readable error string from an array of error messages", () => {
    logVerificationErrors()
  })
})