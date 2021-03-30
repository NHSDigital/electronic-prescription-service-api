import * as TestResources from "../../../resources/test-resources"
import {getIdentifierValueForSystem} from "../../../../src/services/translation/common"
import {createPractitioner} from "../../../../src/services/translation/response/practitioner"
import {getCancellationResponse} from "../common/test-helpers"
import {hl7V3, fhir} from "@models"

describe("createPractitioner", () => {
  const cancellationErrorResponse = getCancellationResponse(TestResources.spineResponses.cancellationError)
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

  const cases = [
    ["authorPractitioner", authorAgentPerson, authorPractitioner],
    ["performerPractitioner", performerAgentPerson, performerPractitioner]
  ]

  test.each(cases)(
    "%p has an identifier with correct SDS user id",
    (name: string, hl7Practitioner: hl7V3.AgentPerson, fhirPractitioner: fhir.Practitioner) => {
      const sdsIdentifier = getIdentifierValueForSystem(
        fhirPractitioner.identifier,
        "https://fhir.hl7.org.uk/Id/professional-code",
        "author.identifier")
      expect(sdsIdentifier).toBe(hl7Practitioner.agentPerson.id._attributes.extension)
    })

  test("author practitioner has correct family and given names, and prefix", () => {
    expect(authorPractitioner.name).not.toBeUndefined()
    expect(authorPractitioner.name[0].family).toBe("Edwards")
    expect(authorPractitioner.name[0].given[0]).toBe("Thomas")
    expect(authorPractitioner.name[0].prefix[0]).toBe("DR")
  })

  test("performer practitioner has correct name", () => {
    expect(performerPractitioner.name[0].text).toBe(performerAgentPerson.agentPerson.name._text)
  })
})
