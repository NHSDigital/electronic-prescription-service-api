import * as fhir from "../../../src/models/fhir/fhir-resources"
import {Telecom, TelecomUse} from "../../../src/models/hl7-v3/hl7-v3-datatypes-core"
import * as practitioner from "../../../src/services/translation/prescription/practitioner"
import * as helpers from "../../resources/test-helpers"
import * as TestResources from "../../resources/test-resources"
import * as common from "../../../src/services/translation/common/getResourcesOfType"

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
    const output = practitioner.getAgentPersonTelecom(roleTelecom, practitionerTelecom)
    expect(output).toEqual(roleTelecomExpected)
  })
  test("if practitionerRole has no telecom and practitioner has telecom then we return that", () => {
    const output = practitioner.getAgentPersonTelecom(undefined, practitionerTelecom)
    expect(output).toEqual(practitionerTelecomExpected)
  })
  test("if neither practitionerRole or practitioner has telecom then we return undefined", () => {
    const output = practitioner.getAgentPersonTelecom(undefined, undefined)
    expect(output).toEqual(undefined)
  })
})

describe("getAgentPersonPersonId", () => {
  const gmcCode: fhir.Identifier = {
    "system": "https://fhir.hl7.org.uk/Id/gmc-number",
    "value": "gmc"
  }
  const gmpCode : fhir.Identifier = {
    "system": "https://fhir.hl7.org.uk/Id/gmp-number",
    "value": "gmp"
  }

  test("if more than 1 professional code is present for a practitioner then throw", () => {
    expect(() => practitioner.getAgentPersonPersonId(
      [gmcCode, gmpCode]
    )).toThrow()
  })
  test("if no professional code is specified for a practitioner then throw", () => {
    expect(() => practitioner.getAgentPersonPersonId(
      []
    )).toThrow()
  })
})

describe("getAgentPersonPersonIdForResponsibleParty", () => {
  const dinCode: fhir.Identifier = {
    "system": "https://fhir.hl7.org.uk/Id/din-number",
    "value": "din"
  }
  const spuriousCode : fhir.Identifier = {
    "system": "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code",
    "value": "spurious"
  }

  test("if more than 1 prescribing code is present for a practitioner role then throw", () => {
    expect(() => practitioner.getAgentPersonPersonIdForResponsibleParty(
      [], [dinCode, spuriousCode]
    )).toThrow()
  })
  test("if no prescribing code is specified for a practitioner role then throw", () => {
    expect(() => practitioner.getAgentPersonPersonIdForResponsibleParty(
      [], [dinCode, spuriousCode]
    )).toThrow()
  })
})

describe("convertAuthor", () => {
  let bundle: fhir.Bundle
  let fhirFirstMedicationRequest: fhir.MedicationRequest

  beforeEach(() => {
    bundle = helpers.clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    fhirFirstMedicationRequest = common.getMedicationRequests(bundle)[0]
  })

  test("includes a time or signatureText field for a message which isn't a cancellation", () => {
    const isCancellation = false
    const result = practitioner.convertAuthor(bundle, fhirFirstMedicationRequest, isCancellation)
    expect(Object.keys(result)).toContain("time")
    expect(Object.keys(result)).toContain("signatureText")
  })

  test("doesn't include a time or signatureText field for a cancellation message", () => {
    const isCancellation = true
    const result = practitioner.convertAuthor(bundle, fhirFirstMedicationRequest, isCancellation)
    expect(Object.keys(result)).not.toContain("time")
    expect(Object.keys(result)).not.toContain("signatureText")
  })
})
