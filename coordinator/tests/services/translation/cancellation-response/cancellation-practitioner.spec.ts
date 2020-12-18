import * as TestResources from "../../../resources/test-resources"
import {getIdentifierValueForSystem} from "../../../../src/services/translation/common"
import {createPractitioner} from "../../../../src/services/translation/cancellation/cancellation-practitioner"
import {getCancellationResponse} from "./test-helpers"

describe("createPractitioner", () => {
  const cancellationResponse = getCancellationResponse(TestResources.spineResponses.cancellationError)
  const author = createPractitioner(cancellationResponse.author.AgentPerson)

  test("returned practitioner has an identifier with correct SDS user id", () => {
    expect(author.identifier).not.toBeUndefined()
    expect(author.identifier.length).toBe(1)
    const sdsIdentifier = getIdentifierValueForSystem(
      author.identifier,
      "https://fhir.hl7.org.uk/Id/professional-code",
      "author.identifier")
    expect(sdsIdentifier).toBe("4428981")
  })

  test("returned practitioner has correct family and given names, and prefix", () => {
    expect(author.name).not.toBeUndefined()
    expect(author.name[0].family).toBe("Edwards")
    expect(author.name[0].given[0]).toBe("Thomas")
    expect(author.name[0].prefix[0]).toBe("DR")
  })
})
