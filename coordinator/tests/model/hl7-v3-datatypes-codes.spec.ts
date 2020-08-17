import * as codes from "../../src/model/hl7-v3-datatypes-codes"

describe("GlobalIdentifier", () => {
  test("root not converted to uppercase when not passed a UUID", () => {
    const identifier = new codes.GlobalIdentifier("exampleUUID")
    expect(identifier._attributes.root).toBe("exampleUUID")
  })

  test("root converted to uppercase when passed a lowercase UUID", () => {
    const identifier = new codes.GlobalIdentifier("859f8240-d02f-4ea3-8f7f-0aed7b4d7d4e")
    expect(identifier._attributes.root).toBe("859F8240-D02F-4EA3-8F7F-0AED7B4D7D4E")
  })

  test("root converted to uppercase when passed a mixed case UUID", () => {
    const identifier = new codes.GlobalIdentifier("859F8240-d02f-4EA3-8f7f-0aed7b4D7D4e")
    expect(identifier._attributes.root).toBe("859F8240-D02F-4EA3-8F7F-0AED7B4D7D4E")
  })
})
