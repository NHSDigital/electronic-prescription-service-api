import {fhir} from "../../../../../../models/library"
import {translateReleaseRequest} from "../../../../../src/services/translation/request/dispense/release"
import pino from "pino"

const logger = pino()

describe("translateReleaseRequest", () => {
  const parameters = new fhir.Parameters([{
    "name": "owner",
    "valueIdentifier": {
      "system": "https://fhir.nhs.uk/Id/ods-organization-code",
      "value": "FTX40"
    }
  }])
  const translatedRelease = translateReleaseRequest(parameters, logger)

  test("translated release contains agentPersonPerson and representedOrganization", async () => {
    const author = (await translatedRelease).NominatedPrescriptionReleaseRequest.author
    expect(author).toBeTruthy()
    const agentPerson = author.AgentPerson
    expect(agentPerson).toBeTruthy()
    const agentPersonPerson = agentPerson.agentPerson
    const representedOrganization = agentPerson.representedOrganization
    expect(agentPersonPerson).toBeTruthy()
    expect(representedOrganization).toBeTruthy()
  })

  test("translates organizationId correctly", async () => {
    const agentPerson = (await translatedRelease).NominatedPrescriptionReleaseRequest.author.AgentPerson
    const organizationId = agentPerson.representedOrganization.id._attributes.extension
    expect(organizationId).toBe("FTX40")
  })
})

