import * as TestResources from "../../../resources/test-resources"
import {getIdentifierValueForSystem} from "../../../../src/services/translation/common"
import {readXml} from "../../../../src/services/serialisation/xml"
import {createOrganization} from "../../../../src/services/translation/cancellation/cancellation-organization"
import {SPINE_CANCELLATION_ERROR_RESPONSE_REGEX} from "../../../../src/services/translation/spine-response"

describe("createOrganization", () => {
  const actualError = TestResources.spineResponses.cancellationError
  const preParsedMsg = SPINE_CANCELLATION_ERROR_RESPONSE_REGEX.exec(actualError.response.body)[0]
  const parsedMsg = readXml(preParsedMsg)
  const actEvent = parsedMsg["hl7:PORX_IN050101UK31"]["hl7:ControlActEvent"]
  const cancellationResponse = actEvent["hl7:subject"].CancellationResponse
  const authorOrganization = createOrganization(cancellationResponse.author.AgentPerson.representedOrganization)

  test("has an identifier block with the correct value", () => {
    expect(authorOrganization.identifier).not.toBeUndefined()
    const identifierValue = getIdentifierValueForSystem(
      authorOrganization.identifier,
      "https://fhir.nhs.uk/Id/ods-organization-code",
      "Organization.identifier"
    )
    expect(identifierValue).toBe("RBA")
  })

  test("has a type block with correct coding values", () => {
    expect(authorOrganization.type).not.toBeUndefined()
    expect(authorOrganization.type[0].coding[0].code).toBe("RO197")
    expect(authorOrganization.type[0].coding[0].display).toBeTruthy()
  })

  test("has correct name value", () => {
    expect(authorOrganization.name).toBe("TAUNTON AND SOMERSET NHS FOUNDATION TRUST")
  })

  test("has correct telecom value", () => {
    expect(authorOrganization.telecom[0].system).toBe("phone")
    expect(authorOrganization.telecom[0].value).toBe("01823333444")
    expect(authorOrganization.telecom[0].use).toBe("work")
  })

  test("has correct address value", () => {
    expect(authorOrganization.address[0].postalCode).toBe("TA1 5DA")
    expect(authorOrganization.address[0].line.length).toBe(3)
    expect(authorOrganization.address[0].line[0]).toBe("MUSGROVE PARK HOSPITAL")
    expect(authorOrganization.address[0].line[1]).toBe("PARKFIELD DRIVE")
    expect(authorOrganization.address[0].line[2]).toBe("TAUNTON")
  })
})
