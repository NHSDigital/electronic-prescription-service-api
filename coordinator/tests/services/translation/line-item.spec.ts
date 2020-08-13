import {convertLineItemComponent} from "../../../src/services/translation/line-item"
import {writeXmlStringPretty} from "../../../src/services/translation/xml"
import * as LosslessJson from "lossless-json"

describe("numeric precision is preserved by translation", () => {
  test.each([
    ["20", "20"],
    ["20.00", "20.00"],
    ["\"20\"", "20"],
    ["\"20.00\"", "20.00"]
  ])("when quantity is %s", (inputQuantityValue: string, outputQuantityValue: string) => {
    const inputQuantity = LosslessJson.parse(`{"value": ${inputQuantityValue}, "unit": "ml"}`)
    const component = convertLineItemComponent(inputQuantity)
    const outputQuantity = writeXmlStringPretty(component.lineItemQuantity.quantity)
    expect(outputQuantity).toEqual(`<translation codeSystem="2.16.840.1.113883.2.1.3.2.4.15" displayName="ml" value="${outputQuantityValue}"/>`)
  })
})
