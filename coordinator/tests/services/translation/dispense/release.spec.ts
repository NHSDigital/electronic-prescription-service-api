import * as fhir from "../../../../src/models/fhir"
import {translateReleaseRequest} from "../../../../src/services/translation/dispense/release"

describe("translateReleaseRequest", () => {
  const parameters = new fhir.Parameters([{
    "name": "owner",
    "valueIdentifier": {
      "system": "https://fhir.nhs.uk/Id/ods-organization-code",
      "value": "VNE51"
    }
  }])
  const translatedRelease = translateReleaseRequest(parameters)

  test("translated release contains agentPersonPerson and representedOrganization", () => {
    const author = translatedRelease.NominatedPrescriptionReleaseRequest.author
    expect(author).not.toBeUndefined()
    const agentPerson = author.AgentPerson
    expect(agentPerson).not.toBeUndefined()
    const agentPersonPerson = agentPerson.agentPerson
    const representedOrganization = agentPerson.representedOrganization
    expect(agentPersonPerson).not.toBeUndefined()
    expect(representedOrganization).not.toBeUndefined()
  })

  test("translates organizationId correctly", () => {
    const agentPerson = translatedRelease.NominatedPrescriptionReleaseRequest.author.AgentPerson
    const organizationId = agentPerson.representedOrganization.id._attributes.extension
    expect(organizationId).toBe("VNE51")
  })
})
