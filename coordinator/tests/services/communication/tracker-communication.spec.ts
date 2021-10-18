import * as TestResources from "../../resources/test-resources"
import {fhir} from "@models"
import {convertSpineResponseToFhir} from "../../../src/services/communication/tracker/translation"

describe("translateToFhir", () => {
  it("succeeds with 1 line item", () => {
    const spineResponse = TestResources.trackerSpineResponses.success1LineItem
    const bundleResponse = convertSpineResponseToFhir(spineResponse) as fhir.Bundle
    bundleResponse.entry
      .map(entry => entry.resource as fhir.Task)
      .forEach(task => expect(task.input[0].valueReference.identifier.value)
        .toEqual("30b7e9cf-6f42-40a8-84c1-e61ef638eee2"))
  })

  it("succeeds with many line items", () => {
    const spineResponse = TestResources.trackerSpineResponses.success2LineItems
    const bundleResponse = convertSpineResponseToFhir(spineResponse) as fhir.Bundle
    bundleResponse.entry
      .map(entry => entry.resource as fhir.Task)
      .forEach(task => {
        const id = task.focus.identifier.value
        task.input.forEach((input, index) => {
          expect(input.valueReference.identifier.value).toEqual(Object.keys(spineResponse[id].lineItems)[index])
        })
      })
  })

  it("succeeds with a prescription in 'To be Dispensed' state", () => {
    const spineResponse = TestResources.trackerSpineResponses.successCreated
    const bundleResponse = convertSpineResponseToFhir(spineResponse) as fhir.Bundle
    bundleResponse.entry
      .map(entry => entry.resource as fhir.Task)
      .forEach(task => {
        expect(task.businessStatus.coding[0].display).toEqual("To be Dispensed")
        expect(task.businessStatus.coding[0].code).toEqual("0001")

        task.input.forEach(input => {
          expect(input.extension[0].extension).toHaveLength(1)
        })

        task.output.forEach(output => {
          expect(output.extension).toBeUndefined()
        })
      })

  })

  it("succeeds with a prescription in 'Dispensed' state", () => {
    const spineResponse = TestResources.trackerSpineResponses.successClaimed
    const bundleResponse = convertSpineResponseToFhir(spineResponse) as fhir.Bundle
    bundleResponse.entry
      .map(entry => entry.resource as fhir.Task)
      .forEach(task => {
        expect(task.businessStatus.coding[0].display).toEqual("Dispensed")
        expect(task.businessStatus.coding[0].code).toEqual("0006")

        task.input.forEach(input => {
          expect(input.extension[0].extension).toHaveLength(2)
        })

        task.output.forEach(output => {
          expect(output.extension[0].extension).toHaveLength(3)
        })
      })
  })

  it("returns operationOutcome on non-zero statusCode", () => {
    const spineResponse = TestResources.trackerSpineResponses.errorNoIssueNumber
    const operationOutcomeResponse = convertSpineResponseToFhir(spineResponse)
    expect(operationOutcomeResponse.resourceType).toBe("OperationOutcome")
  })
})
