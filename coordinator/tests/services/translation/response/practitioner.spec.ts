import * as TestResources from "../../../resources/test-resources"
import {createPractitioner} from "../../../../src/services/translation/response/practitioner"
import {getCancellationResponse} from "../common/test-helpers"

describe("createPractitioner", () => {
  const cancellationErrorResponse = getCancellationResponse(TestResources.spineResponses.cancellationNotFoundError)
  const cancellationErrorDispensedResponse = getCancellationResponse(
    TestResources.spineResponses.cancellationDispensedError
  )
  const authorAgentPerson = cancellationErrorResponse.author.AgentPerson
  const performerAgentPerson = cancellationErrorDispensedResponse.performer.AgentPerson

  const authorPractitioner = createPractitioner(
    authorAgentPerson
  )

  const performerPractitioner = createPractitioner(
    performerAgentPerson
  )

  test("author practitioner has correct identifier", () => {
    expect(authorPractitioner.identifier).toMatchObject([{
      system: "https://fhir.hl7.org.uk/Id/gphc-number",
      value: "4428981"
    }])
  })

  test("author practitioner has correct family and given names, and prefix", () => {
    expect(authorPractitioner.name).not.toBeUndefined()
    expect(authorPractitioner.name[0].family).toBe("Edwards")
    expect(authorPractitioner.name[0].given[0]).toBe("Thomas")
    expect(authorPractitioner.name[0].prefix[0]).toBe("DR")
  })

  test("performer practitioner has correct identifier", () => {
    expect(performerPractitioner.identifier).toMatchObject([{
      system: "https://fhir.hl7.org.uk/Id/professional-code",
      value: "131167442519"
    }])
  })

  test("performer practitioner has correct name", () => {
    expect(performerPractitioner.name[0].text).toBe("Taylor Paul")
  })
})
