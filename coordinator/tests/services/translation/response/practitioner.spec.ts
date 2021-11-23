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

  const authorPractitioner = createPractitioner(authorAgentPerson)

  const performerPractitioner = createPractitioner(performerAgentPerson)

  test("author practitioner has correct identifier", () => {
    expect(authorPractitioner.identifier).toMatchObject([{
      system: "https://fhir.hl7.org.uk/Id/din-number",
      value: "683458"
    }])
  })

  test("author practitioner has correct family and given names, and prefix", () => {
    expect(authorPractitioner.name).not.toBeUndefined()
    expect(authorPractitioner.name[0].family).toBe("FIFTYSEVEN")
    expect(authorPractitioner.name[0].given[0]).toBe("RANDOM")
    expect(authorPractitioner.name[0].prefix[0]).toBe("MR")
  })

  test("performer practitioner has correct identifier", () => {
    expect(performerPractitioner.identifier).toMatchObject([{
      system: "https://fhir.hl7.org.uk/Id/gmp-number",
      value: "G9999999"
    }])
  })

  test("performer practitioner has correct name", () => {
    expect(performerPractitioner.name[0].given[0]).toBe("Unattended")
    expect(performerPractitioner.name[0].family).toBe("Access")
  })
})
