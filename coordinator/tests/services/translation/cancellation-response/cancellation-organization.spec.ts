import * as TestResources from "../../../resources/test-resources"
import {getIdentifierValueForSystem} from "../../../../src/services/translation/common"
import {createOrganization} from "../../../../src/services/translation/cancellation/cancellation-organization"
import {getCancellationResponse} from "./test-helpers"
import * as fhir from "../../../../src/models/fhir/fhir-resources"
import * as hl7 from "../../../../src/models/hl7-v3/hl7-v3-people-places"

const cancellationResponse = getCancellationResponse(TestResources.spineResponses.cancellationError)
const cancellationDispensedResponse = getCancellationResponse(TestResources.spineResponses.cancellationDispensedError)

const authorRepresentedOrganization = cancellationResponse.author.AgentPerson.representedOrganization
const performerRepresentedOrganization = cancellationDispensedResponse.performer.AgentPerson.representedOrganization

const authorOrganization = createOrganization(authorRepresentedOrganization)
const performerOrganization = createOrganization(performerRepresentedOrganization)

const cases = [
  ["authorOrganization", authorOrganization, authorRepresentedOrganization],
  ["performerOrganization", performerOrganization, performerRepresentedOrganization]
]

describe.each(cases)(
  "createOrganization",
  (organizationName: string, fhirOrganization: fhir.Organization, hl7Organization: hl7.Organization) => {

    test(
      "%p has an identifier block with the correct value",
      () => {
        expect(fhirOrganization.identifier).not.toBeUndefined()
        const identifierValue = getIdentifierValueForSystem(
          fhirOrganization.identifier,
          "https://fhir.nhs.uk/Id/ods-organization-code",
          "Organization.identifier"
        )
        expect(identifierValue).toBe(hl7Organization.id._attributes.extension)
      })

    test(
      "%p has a type block with correct coding values",
      () => {
        expect(fhirOrganization.type).not.toBeUndefined()
        expect(fhirOrganization.type[0].coding[0].code).toBe("RO197")
        expect(fhirOrganization.type[0].coding[0].display).toBeTruthy()
      })

    test(
      "%p has correct name value",
      () => {
        expect(fhirOrganization.name).toBe(hl7Organization.name._text)
      })

    test(
      "%p has correct telecom value",
      () => {
        expect(fhirOrganization.telecom[0].system).toBe("phone")
        expect(fhirOrganization.telecom[0].value).toBe(hl7Organization.telecom._attributes.value.split(":")[1])
        expect(fhirOrganization.telecom[0].use).toBe("work")
      })

    test(
      "%p has correct address value",
      () => {
        expect(fhirOrganization.address[0].postalCode).toBe(hl7Organization.addr.postalCode._text)
        fhirOrganization.address[0].line.forEach(
          (line, index) => expect(line).toBe(hl7Organization.addr.streetAddressLine[index]._text)
        )
      })
  })
