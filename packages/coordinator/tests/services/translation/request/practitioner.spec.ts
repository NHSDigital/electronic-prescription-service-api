import * as practitioner from "../../../../src/services/translation/request/practitioner"
import * as helpers from "../../../resources/test-helpers"
import * as TestResources from "../../../resources/test-resources"
import * as common from "../../../../src/services/translation/common/getResourcesOfType"
import {getMessageHeader, getProvenances} from "../../../../src/services/translation/common/getResourcesOfType"
import {fhir, hl7V3, processingErrors as errors} from "@models"
import {MomentFormatSpecification, MomentInput} from "moment"
import {onlyElement} from "../../../../src/services/translation/common"
import {convertIsoDateTimeStringToHl7V3DateTime} from "../../../../src/services/translation/common/dateTime"
import requireActual = jest.requireActual

const actualMoment = requireActual("moment")
jest.mock("moment", () => ({
  utc: (input?: MomentInput, format?: MomentFormatSpecification) =>
    actualMoment.utc(input || "2020-12-18T12:34:34Z", format)
}))

describe("getAgentPersonTelecom", () => {
  const roleTelecom: Array<fhir.ContactPoint> = [
    {
      system: "phone",
      value: "tel:01512631737",
      use: "work"
    }
  ]
  const practitionerTelecom: Array<fhir.ContactPoint> = [
    {
      system: "phone",
      value: "tel:01",
      use: "work"
    }
  ]
  const roleTelecomExpected: Array<hl7V3.Telecom> = [
    {
      _attributes: {
        use: hl7V3.TelecomUse.WORKPLACE,
        value: "tel:01512631737"
      }
    }
  ]
  const practitionerTelecomExpected: Array<hl7V3.Telecom> = [
    {
      _attributes: {
        use: hl7V3.TelecomUse.WORKPLACE,
        value: "tel:01"
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

describe("getJobRoleCodeOrName", () => {
  test("Only JobRoleName", () => {
    const practitionerRole = new fhir.PractitionerRole()
    const coding = {
      system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
      code: "R8000",
      display: "Clinical Practitioner Access Role"
    }
    practitionerRole.code = [{coding: [coding]}]
    const jobRoleCode = practitioner.getJobRoleCodeOrName(practitionerRole)
    expect(jobRoleCode).toEqual(coding)
  })
  test("Only JobRoleCode", () => {
    const practitionerRole = new fhir.PractitionerRole()
    const coding = {
      system: "https://fhir.nhs.uk/CodeSystem/NHSDigital-SDS-JobRoleCode",
      code: "S8000:G8000:R8000",
      display: "Clinical Practitioner Access Role"
    }
    practitionerRole.code = [{coding: [coding]}]
    const jobRoleCode = practitioner.getJobRoleCodeOrName(practitionerRole)
    expect(jobRoleCode).toEqual(coding)
  })
  test("Neither JobRoleCode nor JobRoleName", () => {
    const practitionerRole = new fhir.PractitionerRole()
    practitionerRole.code = [{coding: []}]
    const jobRoleCode = () => practitioner.getJobRoleCodeOrName(practitionerRole)
    expect(jobRoleCode).toThrowError(new errors.TooFewValuesError(
      // eslint-disable-next-line max-len
      "Too few values submitted. Expected at least 1 element where system in [https://fhir.nhs.uk/CodeSystem/NHSDigital-SDS-JobRoleCode, https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName]."
    ))
  })
})

describe("getAgentPersonPersonIdForAuthor", () => {
  const gmcCodeValue = "1234567"

  const gmcCode: fhir.Identifier = {
    system: "https://fhir.hl7.org.uk/Id/gmc-number",
    value: `C${gmcCodeValue}`
  }
  const gmpCode: fhir.Identifier = {
    system: "https://fhir.hl7.org.uk/Id/gmp-number",
    value: "G1234567"
  }

  test("Removes leading C from GMC code", () => {
    expect(practitioner.getAgentPersonPersonIdForAuthor([gmcCode])._attributes.extension).toBe(gmcCodeValue)
  })

  test("if more than 1 professional code is present for a practitioner then throw", () => {
    expect(() => practitioner.getAgentPersonPersonIdForAuthor([gmcCode, gmpCode])).toThrow()
  })
  test("if no professional code is specified for a practitioner then throw", () => {
    expect(() => practitioner.getAgentPersonPersonIdForAuthor([])).toThrow()
  })
  test("if 1 professional code is present, then return it", () => {
    expect(practitioner.getAgentPersonPersonIdForAuthor([gmpCode])._attributes.extension).toBe(gmpCode.value)
  })
})

describe("getAgentPersonPersonIdForResponsibleParty", () => {
  const dinCode: fhir.Identifier = {
    system: "https://fhir.hl7.org.uk/Id/din-number",
    value: "din"
  }
  const spuriousCode: fhir.Identifier = {
    system: "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code",
    value: "spurious"
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
      system: "https://fhir.hl7.org.uk/Id/gmc-number",
      value: "gmc"
    }
    const result = practitioner.getAgentPersonPersonIdForResponsibleParty([gmcCode], [])
    expect(result._attributes.extension).toEqual(gmcCode.value)
  })
  test("if no prescribing/professional code is specified for a practitioner/role then throw", () => {
    expect(() => practitioner.getAgentPersonPersonIdForResponsibleParty([], [])).toThrow()
  })
})

describe("convertAuthor", () => {
  let bundle: fhir.Bundle
  let fhirFirstMedicationRequest: fhir.MedicationRequest

  beforeEach(() => {
    bundle = helpers.clone(TestResources.specification[0].fhirMessageSigned)
    fhirFirstMedicationRequest = common.getMedicationRequests(bundle)[0]
  })

  describe("for an order", () => {
    beforeEach(() => {
      getMessageHeader(bundle).eventCoding.code = fhir.EventCodingCode.PRESCRIPTION
    })

    test("includes the time and signatureText from the Provenance if present", () => {
      const provenance = onlyElement(getProvenances(bundle), "Bundle.entry.ofType(Provenance)")
      const signature = onlyElement(provenance.signature, "Provenance.signature")
      const expectedTime = convertIsoDateTimeStringToHl7V3DateTime(signature.when, "Provenance.signature.when")
      const result = practitioner.convertAuthor(bundle, fhirFirstMedicationRequest)
      expect(result.time).toEqual(expectedTime)
      expect(result.signatureText).toHaveProperty("Signature")
    })

    test("includes time: now and signatureText: N/A for a message which isn't signed", () => {
      bundle.entry.filter((e) => e.resource.resourceType === "Provenance").forEach((e) => bundle.entry.remove(e))
      const result = practitioner.convertAuthor(bundle, fhirFirstMedicationRequest)
      expect(result.time._attributes.value).toEqual("20201218123434")
      expect(result.signatureText._attributes.nullFlavor).toEqual("NA")
    })

    test("includes time: now and signatureText: N/A for a message which isn't signed by the requester", () => {
      getProvenances(bundle)
        .flatMap((p) => p.signature)
        .forEach((s) => (s.who.reference = "some-other-practitioner"))
      const result = practitioner.convertAuthor(bundle, fhirFirstMedicationRequest)
      expect(result.time._attributes.value).toEqual("20201218123434")
      expect(result.signatureText._attributes.nullFlavor).toEqual("NA")
    })

    test("throws for a signature which isn't in the correct format", () => {
      getProvenances(bundle)
        .flatMap((p) => p.signature)
        .forEach((s) => (s.data = "this is not a valid signature"))
      expect(() => {
        practitioner.convertAuthor(bundle, fhirFirstMedicationRequest)
      }).toThrow(errors.InvalidValueError)
    })
  })
})
