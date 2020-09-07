import * as fhir from "../../../src/model/fhir-resources"
import {Telecom, TelecomUse} from "../../../src/model/hl7-v3-datatypes-core"
import {getAgentPersonPersonId, getAgentPersonTelecom, convertAuthor} from "../../../src/services/translation/practitioner"
import {BsaPrescribingIdentifier, SdsUniqueIdentifier} from "../../../src/model/hl7-v3-datatypes-codes"
import {clone} from "../../resources/test-helpers"
import * as TestResources from "../../resources/test-resources"
import {getMedicationRequests, getPractitionerRoles} from "../../../src/services/translation/common/getResourcesOfType"

describe("getAgentPersonTelecom", () => {
  const roleTelecom: Array<fhir.ContactPoint> = [
    {
      "system": "phone",
      "value": "tel:01512631737",
      "use": "work"
    }
  ]
  const practitionerTelecom: Array<fhir.ContactPoint> = [
    {
      "system": "phone",
      "value": "tel:01",
      "use": "work"
    }
  ]
  const roleTelecomExpected: Array<Telecom> = [
    {
      _attributes:
                {
                  "use": TelecomUse.WORKPLACE,
                  "value": "tel:01512631737"
                }
    }
  ]
  const practitionerTelecomExpected: Array<Telecom> = [
    {
      _attributes:
                {
                  "use": TelecomUse.WORKPLACE,
                  "value": "tel:01"
                }
    }
  ]

  test("if practitionerRole has telecom then we return that", () => {
    const output = getAgentPersonTelecom(roleTelecom, practitionerTelecom)
    expect(output).toEqual(roleTelecomExpected)
  })
  test("if practitionerRole has no telecom and practitioner has telecom then we return that", () => {
    const output = getAgentPersonTelecom(undefined, practitionerTelecom)
    expect(output).toEqual(practitionerTelecomExpected)
  })
  test("if neither practitionerRole or practitioner has telecom then we return undefined", () => {
    const output = getAgentPersonTelecom(undefined, undefined)
    expect(output).toEqual(undefined)
  })
})

describe("getAgentPersonPersonId", () => {
  const spuriousIdentifier: fhir.Identifier = {
    "system": "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code",
    "value": "spurious"
  }
  const dinIdentifier: fhir.Identifier = {
    "system": "https://fhir.hl7.org.uk/Id/din-number",
    "value": "din"
  }
  const userIdentifier: fhir.Identifier = {
    "system": "https://fhir.nhs.uk/Id/sds-user-id",
    "value": "8412511"
  }

  test("if all 3 codes are present we return spurious", () => {
    const output = getAgentPersonPersonId(
      [spuriousIdentifier], [dinIdentifier, userIdentifier]
    )
    expect(output).toEqual(new BsaPrescribingIdentifier(spuriousIdentifier.value))
  })
  test("if spurious code is missing we return DIN", () => {
    const output = getAgentPersonPersonId(
      [], [dinIdentifier, userIdentifier]
    )
    expect(output).toEqual(new BsaPrescribingIdentifier(dinIdentifier.value))
  })
  test("if spurious code and din are missing we return user", () => {
    const output = getAgentPersonPersonId(
      [], [userIdentifier]
    )
    expect(output).toEqual(new SdsUniqueIdentifier(userIdentifier.value))
  })
  test("if all 3 are missing then throw", () => {
    expect(() => getAgentPersonPersonId(
      [], []
    )).toThrow()
  })
})

describe("convertAuthor", () => {
  let bundle: fhir.Bundle
  let fhirFirstMedicationRequest: fhir.MedicationRequest
  let fhirPractitionerRole: fhir.PractitionerRole
  const display = "testDisplay"
  const identifierValue = "testIdentifier"

  beforeEach(() => {
    bundle = clone(TestResources.examplePrescription3.fhirMessageUnsignedHomecare)
    fhirFirstMedicationRequest = getMedicationRequests(bundle)[0]
    fhirPractitionerRole = getPractitionerRoles(bundle)[0]
    fhirPractitionerRole.organization = {
      display: display,
      identifier: [{
        system: "https://fhir.nhs.uk/Id/ods-organization-code",
        value: identifierValue
      }]
    }
  })

  test("when PractitionerRole has a minimal Organization healthCareProviderLicense still gets converted correctly", () => {
    const result = convertAuthor(bundle, fhirFirstMedicationRequest).AgentPerson.representedOrganization

    expect(result.healthCareProviderLicense.Organization.name._text).toBe(display)
    expect(result.healthCareProviderLicense.Organization.id._attributes.extension).toBe(identifierValue)
    expect(result.healthCareProviderLicense.Organization.code._attributes.code).toBe("008")
  })

  test("when PractitionerRole has a minimal Organization representedOrganization still gets converted correctly", () => {
    const bundle2 = clone(TestResources.examplePrescription3.fhirMessageUnsignedHomecare)

    const result = convertAuthor(bundle, fhirFirstMedicationRequest).AgentPerson.representedOrganization
    const result2 = convertAuthor(bundle2, fhirFirstMedicationRequest).AgentPerson.representedOrganization

    delete result.healthCareProviderLicense
    delete result2.healthCareProviderLicense
    expect(result).toEqual(result2)
  })
})
