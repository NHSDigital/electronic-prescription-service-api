import * as TestResources from "../../../../resources/test-resources"
import {fhir} from "@models"
import {convertSpineTrackerResponseToFhir} from "../../../../../src/services/translation/response/tracker/translation"

describe("detail tracker responses", () => {
  it("succeeds with 1 line item", () => {
    const spineResponse = TestResources.detailTrackerResponses.success1LineItem
    const bundleResponse = convertSpineTrackerResponseToFhir(spineResponse) as fhir.Bundle
    bundleResponse.entry
      .map(entry => entry.resource as fhir.Task)
      .forEach(task => expect(task.input[0].valueReference.identifier.value)
        .toEqual("30b7e9cf-6f42-40a8-84c1-e61ef638eee2"))
  })

  it("succeeds with many line items", () => {
    const spineResponse = TestResources.detailTrackerResponses.success2LineItems
    const bundleResponse = convertSpineTrackerResponseToFhir(spineResponse) as fhir.Bundle
    bundleResponse.entry
      .map(entry => entry.resource as fhir.Task)
      .forEach(task => {
        const id = task.focus.identifier.value
        task.input.forEach((input, index) => {
          const expected = Object.keys(spineResponse.prescriptions[id].lineItems)[index]
          expect(input.valueReference.identifier.value).toEqual(expected)
        })
      })
  })

  it("succeeds with a prescription in 'To be Dispensed' state", () => {
    const spineResponse = TestResources.detailTrackerResponses.successCreated
    const bundleResponse = convertSpineTrackerResponseToFhir(spineResponse) as fhir.Bundle
    bundleResponse.entry
      .map(entry => entry.resource as fhir.Task)
      .forEach(task => {
        expect(task.businessStatus.coding[0].display).toEqual("To Be Dispensed")
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
    const spineResponse = TestResources.detailTrackerResponses.successClaimed
    const bundleResponse = convertSpineTrackerResponseToFhir(spineResponse) as fhir.Bundle
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
    const spineResponse = TestResources.detailTrackerResponses.errorNoIssueNumber
    const operationOutcomeResponse = convertSpineTrackerResponseToFhir(spineResponse)
    expect(operationOutcomeResponse.resourceType).toBe("OperationOutcome")
  })
})

describe("summary tracker responses", () => {
  test("converts a success response to a Bundle of Tasks", () => {
    const spineResponse = TestResources.summaryTrackerResponses.success
    const translatedResponse = convertSpineTrackerResponseToFhir(spineResponse) as fhir.Bundle
    expect(translatedResponse.resourceType).toBe("Bundle")
    expect(translatedResponse.entry).toHaveLength(5)
    translatedResponse.entry.map(entry => entry.resource as fhir.Task).forEach(resource => {
      expect(resource.resourceType).toBe("Task")
      expect(resource.for.identifier.value).toEqual("9449304106")
    })
  })
})
