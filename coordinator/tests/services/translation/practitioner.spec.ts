import * as fhir from "../../../src/models/fhir/fhir-resources"
import {Telecom, TelecomUse} from "../../../src/models/hl7-v3/hl7-v3-datatypes-core"
import * as practitioner from "../../../src/services/translation/prescription/practitioner"
import * as helpers from "../../resources/test-helpers"
import * as TestResources from "../../resources/test-resources"
import * as common from "../../../src/services/translation/common/getResourcesOfType"
import {getMessageHeader, getProvenances} from "../../../src/services/translation/common/getResourcesOfType"
import {MessageType} from "../../../src/routes/util"
import {InvalidValueError} from "../../../src/models/errors/processing-errors"
import requireActual = jest.requireActual
import {MomentInput} from "moment"

const actualMoment = requireActual("moment")
jest.mock("moment", () => ({
  utc: (input?: MomentInput) => actualMoment.utc(input || "2020-12-18T12:34:34Z")
}))

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
  const gmcCodeValue = "123425516"

  const gmcCode: fhir.Identifier = {
    "system": "https://fhir.hl7.org.uk/Id/gmc-number",
    "value": `C${gmcCodeValue}`
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
  test("Removes leading C from GMC code", () => {
    expect(practitioner.getAgentPersonPersonIdForAuthor([gmcCode])._attributes.extension)
      .toBe(gmcCodeValue)
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

  describe("for a cancellation", () => {
    beforeEach(() => {
      getMessageHeader(bundle).eventCoding.code = MessageType.CANCELLATION
    })

    test("doesn't include a time or signatureText field", () => {
      const result = practitioner.convertAuthor(bundle, fhirFirstMedicationRequest)
      expect(Object.keys(result)).not.toContain("time")
      expect(Object.keys(result)).not.toContain("signatureText")
    })
  })

  describe("for an order", () => {
    beforeEach(() => {
      getMessageHeader(bundle).eventCoding.code = MessageType.PRESCRIPTION
    })

    test("includes the time and signatureText from the Provenance if present", () => {
      const result = practitioner.convertAuthor(bundle, fhirFirstMedicationRequest)
      expect(result.time._attributes.value).toEqual("20200902113800")
      expect(result.signatureText).toHaveProperty("Signature")
    })

    test("includes time: now and signatureText: N/A for a message which isn't signed", () => {
      bundle.entry.filter(e => e.resource.resourceType === "Provenance").forEach(e => bundle.entry.remove(e))
      const result = practitioner.convertAuthor(bundle, fhirFirstMedicationRequest)
      expect(result.time._attributes.value).toEqual("20201218123434")
      expect(result.signatureText._attributes.nullFlavor).toEqual("NA")
    })

    test("includes time: now and signatureText: N/A for a message which isn't signed by the requester", () => {
      getProvenances(bundle).flatMap(p => p.signature).forEach(s => s.who.reference = "some-other-practitioner")
      const result = practitioner.convertAuthor(bundle, fhirFirstMedicationRequest)
      expect(result.time._attributes.value).toEqual("20201218123434")
      expect(result.signatureText._attributes.nullFlavor).toEqual("NA")
    })

    test("throws for a signature which isn't in the correct format", () => {
      getProvenances(bundle).flatMap(p => p.signature).forEach(s => s.data = "this is not a valid signature")
      expect(() => {
        practitioner.convertAuthor(bundle, fhirFirstMedicationRequest)
      }).toThrow(InvalidValueError)
    })
  })
})
