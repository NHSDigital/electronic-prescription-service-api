import pino from "pino"
import {addEbXmlWrapper} from "../../src/services/communication/ebxml-request-builder"

describe("addEbXmlWrapper", () => {
  const logger = pino()

  test("throws an error when interactionId not in map", () => {
    expect(() => addEbXmlWrapper({interactionId: "", message: ""}, logger)).toThrow("Interaction not supported")
  })

  test("Doesn't throw an error when interaction ID is recognised", () => {
    expect(() => addEbXmlWrapper({interactionId: "PORX_IN020102SM31", message: ""}, logger)).not.toThrow()
  })
})
