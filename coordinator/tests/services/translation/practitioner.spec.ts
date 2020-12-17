import * as fhir from "../../../src/models/fhir/fhir-resources"
import {Telecom, TelecomUse} from "../../../src/models/hl7-v3/hl7-v3-datatypes-core"
import * as practitioner from "../../../src/services/translation/prescription/practitioner"
import * as helpers from "../../resources/test-helpers"
import * as TestResources from "../../resources/test-resources"
import * as common from "../../../src/services/translation/common/getResourcesOfType"
import {getMessageHeader, getProvenances} from "../../../src/services/translation/common/getResourcesOfType"
import {MessageType} from "../../../src/routes/util"
import {InvalidValueError} from "../../../src/models/errors/processing-errors";

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

describe("getAgentPersonPersonIdForAuthor", () => {
  const gmcCode: fhir.Identifier = {
    "system": "https://fhir.hl7.org.uk/Id/gmc-number",
    "value": "gmc"
  }
  const gmpCode : fhir.Identifier = {
    "system": "https://fhir.hl7.org.uk/Id/gmp-number",
    "value": "gmp"
  }

  test("if more than 1 professional code is present for a practitioner then throw", () => {
    expect(() => practitioner.getAgentPersonPersonIdForAuthor(
      [gmcCode, gmpCode]
    )).toThrow()
  })
  test("if no professional code is specified for a practitioner then throw", () => {
    expect(() => practitioner.getAgentPersonPersonIdForAuthor(
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

  test("if spurious code is present for a practitioner role than use this as the prescribing code", () => {
    const result = practitioner.getAgentPersonPersonIdForResponsibleParty([dinCode], [spuriousCode])
    expect(result._attributes.extension).toEqual(spuriousCode.value)
  })
  test("if din code is present for practitioner then use this as the prescribing code", () => {
    const result = practitioner.getAgentPersonPersonIdForResponsibleParty([dinCode], [])
    expect(result._attributes.extension).toEqual(dinCode.value)
  })
  test("if no prescribing code is present then use a professional code as the prescribing code", () => {
    const gmcCode: fhir.Identifier = {
      "system": "https://fhir.hl7.org.uk/Id/gmc-number",
      "value": "gmc"
    }
    const result = practitioner.getAgentPersonPersonIdForResponsibleParty([gmcCode], [])
    expect(result._attributes.extension).toEqual(gmcCode.value)
  })
  test("if no prescribing/professional code is specified for a practitioner/role then throw", () => {
    expect(() => practitioner.getAgentPersonPersonIdForResponsibleParty(
      [], []
    )).toThrow()
  })
})

describe("convertAuthor", () => {
  let bundle: fhir.Bundle
  let fhirFirstMedicationRequest: fhir.MedicationRequest

  beforeEach(() => {
    bundle = helpers.clone(TestResources.examplePrescription1.fhirMessageSigned)
    fhirFirstMedicationRequest = common.getMedicationRequests(bundle)[0]
  })

  test("includes a time or signatureText field for a message which isn't a cancellation", () => {
    getMessageHeader(bundle).eventCoding.code = MessageType.PRESCRIPTION
    const result = practitioner.convertAuthor(bundle, fhirFirstMedicationRequest)
    expect(Object.keys(result)).toContain("time")
    expect(Object.keys(result)).toContain("signatureText")
  })

  test("doesn't include a time or signatureText field for a cancellation message", () => {
    getMessageHeader(bundle).eventCoding.code = MessageType.CANCELLATION
    const result = practitioner.convertAuthor(bundle, fhirFirstMedicationRequest)
    expect(Object.keys(result)).not.toContain("time")
    expect(Object.keys(result)).not.toContain("signatureText")
  })

  test("includes N/A signatureText field for a message which isn't signed", () => {
    getMessageHeader(bundle).eventCoding.code = MessageType.PRESCRIPTION
    bundle.entry.filter(e => e.resource.resourceType === "Provenance").forEach(bundle.entry.remove)
    const result = practitioner.convertAuthor(bundle, fhirFirstMedicationRequest)
    expect(Object.keys(result)).toContain("signatureText")
    expect(result.signatureText._attributes.nullFlavor).toEqual("NA")
  })

  test("includes N/A signatureText field for a message which isn't signed by the requester", () => {
    getMessageHeader(bundle).eventCoding.code = MessageType.PRESCRIPTION
    getProvenances(bundle).flatMap(p => p.signature).forEach(s => s.who.reference = "some-other-practitioner")
    const result = practitioner.convertAuthor(bundle, fhirFirstMedicationRequest)
    expect(Object.keys(result)).toContain("signatureText")
    expect(result.signatureText._attributes.nullFlavor).toEqual("NA")
  })

  test("throws for a signature which isn't in the correct format", () => {
    getMessageHeader(bundle).eventCoding.code = MessageType.PRESCRIPTION
    getProvenances(bundle).flatMap(p => p.signature).forEach(s => s.data = "this is not a valid signature")
    expect(() => {
      practitioner.convertAuthor(bundle, fhirFirstMedicationRequest)
    }).toThrow(InvalidValueError)
  })
})
