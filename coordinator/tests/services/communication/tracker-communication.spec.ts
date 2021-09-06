import * as TestResources from "../../resources/test-resources"
import {convertDetailedJsonResponseToFhirTask} from "../../../src/services/communication/tracker"

describe("translateToFhir", () => {
  const spineResponse = JSON.parse(TestResources.trackerSpineResponses.success)

  it("converts spine prescription-order successes", () => {
    const taskResponse = convertDetailedJsonResponseToFhirTask(spineResponse)
    expect(taskResponse.resourceType).toEqual("Task")
  })
})
