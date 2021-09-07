import * as TestResources from "../../resources/test-resources"
import {convertDetailedJsonResponseToFhirTask} from "../../../src/services/communication/tracker/translation"

describe("translateToFhir", () => {

  it("succeeds with 1 line item", () => {
    const spineResponse = JSON.parse(TestResources.trackerSpineResponses.success1LineItem)
    const taskResponse = convertDetailedJsonResponseToFhirTask(spineResponse)
    expect(taskResponse.input[0].valueReference.identifier.value).toEqual("30b7e9cf-6f42-40a8-84c1-e61ef638eee2")
  })

  it("succeeds with many line items", () => {
    const spineResponse = JSON.parse(TestResources.trackerSpineResponses.success2LineItems)
    const taskResponse = convertDetailedJsonResponseToFhirTask(spineResponse)
    expect(taskResponse.input[0].valueReference.identifier.value).toEqual("30b7e9cf-6f42-40a8-84c1-e61ef638eee2")
    expect(taskResponse.input[1].valueReference.identifier.value).toEqual("636f1b57-e18c-4f45-acae-2d7db86b6e1e")
  })

  it("succeeds with a prescription in 'To be Dispensed' state", () => {
    const spineResponse = JSON.parse(TestResources.trackerSpineResponses.successCreated)
    const taskResponse = convertDetailedJsonResponseToFhirTask(spineResponse)
    expect(taskResponse.businessStatus.coding[0].display).toEqual("To be Dispensed")
    expect(taskResponse.businessStatus.coding[0].code).toEqual("0001")
    expect(taskResponse.input[0].extension[0].extension).toHaveLength(2)
    expect(taskResponse.output[0].extension).toBeUndefined()
  })

  it("succeeds with a prescription in 'Dispensed' state", () => {
    const spineResponse = JSON.parse(TestResources.trackerSpineResponses.successClaimed)
    const taskResponse = convertDetailedJsonResponseToFhirTask(spineResponse)
    expect(taskResponse.businessStatus.coding[0].display).toEqual("Dispensed")
    expect(taskResponse.businessStatus.coding[0].code).toEqual("0006")
    expect(taskResponse.input[0].extension[0].extension).toHaveLength(3)
    expect(taskResponse.output[0].extension[0].extension).toHaveLength(3)
  })
})
