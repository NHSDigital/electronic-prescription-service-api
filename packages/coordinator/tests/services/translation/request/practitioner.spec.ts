import {
  sourceAgentPersonTelecom,
  setAgentPersonTelecom,
  getAgentPersonPersonIdForAuthor,
  getAgentPersonPersonIdForResponsibleParty,
  convertAuthor,
  AgentPersonTelecomSource
} from "../../../../src/services/translation/request/practitioner"
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
  const childTelecom: Array<fhir.ContactPoint> = [
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
  const childTelecomExpected: Array<hl7V3.Telecom> = [
    {
      _attributes: {
        use: hl7V3.TelecomUse.WORKPLACE,
        value: "tel:01"
      }
    }
  ]

  function roleSource() : AgentPersonTelecomSource {
    return {
      contactPoints: roleTelecom,
      fhirPath: "PractitionerRole.telecom"
    }
  }
  function childSource() : AgentPersonTelecomSource {
    return {
      contactPoints: childTelecom,
      fhirPath: "Practitioner.telecom"
    }
  }

  test("if practitionerRole has telecom then we return that", () => {
    const output = sourceAgentPersonTelecom(roleSource(), childSource())
    expect(output).toEqual(roleTelecomExpected)
  })
  test("if practitionerRole has no telecom and child source has telecom then we return that", () => {
    const output = sourceAgentPersonTelecom(undefined, childSource())
    expect(output).toEqual(childTelecomExpected)
  })
  test("if neither practitionerRole or child source has telecom then we return undefined", () => {
    const output = sourceAgentPersonTelecom(undefined, undefined)
    expect(output).toEqual(undefined)
  })
})

describe("setAgentPersonTelecom", () => {
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
  const organizationTelecom: Array<fhir.ContactPoint> = [
    {
      system: "phone",
      value: "tel:02",
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
  const organizationTelecomExpected: Array<hl7V3.Telecom> = [
    {
      _attributes: {
        use: hl7V3.TelecomUse.WORKPLACE,
        value: "tel:02"
      }
    }
  ]

  enum PractitionerType {
    RESOURCE_REFERENCE = "resourceReference",
    IDENTIFIER_REFERENCE = "identifierReference"
  }
  function examplePractitionerRoleWithTelecom(
    withTelecom: boolean, practitionerType: PractitionerType, withOrganization: boolean
  ): fhir.PractitionerRole {
    const practitionerRole: fhir.PractitionerRole = {
      resourceType: "PractitionerRole"
    }
    if (withTelecom) {
      practitionerRole.telecom = roleTelecom
    }
    if (withOrganization) {
      practitionerRole.organization = {
        reference: "Organization/1"
      }
    }
    if (practitionerType === PractitionerType.RESOURCE_REFERENCE) {
      practitionerRole.practitioner = {
        reference: "Practitioner/1"
      }
    } else {
      practitionerRole.practitioner = {
        identifier: {
          system: "https://fhir.hl7.org.uk/Id/gmc-number",
          value: "6095103"
        }
      }
    }

    return practitionerRole
  }

  function examplePractitioner(withTelecom: boolean): fhir.Practitioner{
    const practitioner: fhir.Practitioner = {
      resourceType: "Practitioner"
    }
    if (withTelecom) {
      practitioner.telecom = practitionerTelecom
    }
    return practitioner
  }

  function exampleOrganization(withTelecom: boolean): fhir.Organization{
    const organization: fhir.Organization = {
      resourceType: "Organization"
    }
    if (withTelecom) {
      organization.telecom = organizationTelecom
    }
    return organization
  }

  describe("if practitioner is a resource reference", () => {
    test("if practitionerRole has telecom it is used", () => {
      const practitionerRole = examplePractitionerRoleWithTelecom(true, PractitionerType.RESOURCE_REFERENCE, false)
      const practitioner = examplePractitioner(false)
      const output = setAgentPersonTelecom(new hl7V3.AgentPerson(), practitionerRole, practitioner, undefined)
      expect(output.telecom).toEqual(roleTelecomExpected)
    })

    test("if practitionerRole has no telecom and practitioner has telecom then practitioner telecom is used", () => {
      const practitionerRole = examplePractitionerRoleWithTelecom(false, PractitionerType.RESOURCE_REFERENCE, false)
      const practitioner = examplePractitioner(true)
      const output = setAgentPersonTelecom(new hl7V3.AgentPerson(), practitionerRole, practitioner, undefined)
      expect(output.telecom).toEqual(practitionerTelecomExpected)
    })
  })

  describe("if practitioner is an identity reference", () => {
    test("if practitionerRole has telecom it is used", () => {
      const practitionerRole = examplePractitionerRoleWithTelecom(true, PractitionerType.IDENTIFIER_REFERENCE, true)
      const organization = exampleOrganization(false)
      const output = setAgentPersonTelecom(new hl7V3.AgentPerson(), practitionerRole, undefined, organization)
      expect(output.telecom).toEqual(roleTelecomExpected)
    })

    test("if practitionerRole has no telecom and organization has telecom then organization telecom is used", () => {
      const practitionerRole = examplePractitionerRoleWithTelecom(false, PractitionerType.IDENTIFIER_REFERENCE, true)
      const organization = exampleOrganization(true)
      const output = setAgentPersonTelecom(new hl7V3.AgentPerson(), practitionerRole, undefined, organization)
      expect(output.telecom).toEqual(organizationTelecomExpected)
    })
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
    expect(getAgentPersonPersonIdForAuthor([gmcCode])._attributes.extension).toBe(gmcCodeValue)
  })

  test("if more than 1 professional code is present for a practitioner then throw", () => {
    expect(() => getAgentPersonPersonIdForAuthor([gmcCode, gmpCode])).toThrow()
  })
  test("if no professional code is specified for a practitioner then throw", () => {
    expect(() => getAgentPersonPersonIdForAuthor([])).toThrow()
  })
  test("if 1 professional code is present, then return it", () => {
    expect(getAgentPersonPersonIdForAuthor([gmpCode])._attributes.extension).toBe(gmpCode.value)
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
    const result = getAgentPersonPersonIdForResponsibleParty([dinCode], [spuriousCode])
    expect(result._attributes.extension).toEqual(spuriousCode.value)
  })
  test("if din code is present for practitioner then use this as the prescribing code", () => {
    const result = getAgentPersonPersonIdForResponsibleParty([dinCode], [])
    expect(result._attributes.extension).toEqual(dinCode.value)
  })
  test("if no prescribing code is present then use a professional code as the prescribing code", () => {
    const gmcCode: fhir.Identifier = {
      system: "https://fhir.hl7.org.uk/Id/gmc-number",
      value: "gmc"
    }
    const result = getAgentPersonPersonIdForResponsibleParty([gmcCode], [])
    expect(result._attributes.extension).toEqual(gmcCode.value)
  })
  test("if no prescribing/professional code is specified for a practitioner/role then throw", () => {
    expect(() => getAgentPersonPersonIdForResponsibleParty([], [])).toThrow()
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
      const result = convertAuthor(bundle, fhirFirstMedicationRequest)
      expect(result.time).toEqual(expectedTime)
      expect(result.signatureText).toHaveProperty("Signature")
    })

    test("includes time: now and signatureText: N/A for a message which isn't signed", () => {
      bundle.entry.filter((e) => e.resource.resourceType === "Provenance").forEach((e) => bundle.entry.remove(e))
      const result = convertAuthor(bundle, fhirFirstMedicationRequest)
      expect(result.time._attributes.value).toEqual("20201218123434")
      expect(result.signatureText._attributes.nullFlavor).toEqual("NA")
    })

    test("includes time: now and signatureText: N/A for a message which isn't signed by the requester", () => {
      getProvenances(bundle)
        .flatMap((p) => p.signature)
        .forEach((s) => (s.who.reference = "some-other-practitioner"))
      const result = convertAuthor(bundle, fhirFirstMedicationRequest)
      expect(result.time._attributes.value).toEqual("20201218123434")
      expect(result.signatureText._attributes.nullFlavor).toEqual("NA")
    })

    test("throws for a signature which isn't in the correct format", () => {
      getProvenances(bundle)
        .flatMap((p) => p.signature)
        .forEach((s) => (s.data = "this is not a valid signature"))
      expect(() => {
        convertAuthor(bundle, fhirFirstMedicationRequest)
      }).toThrow(errors.InvalidValueError)
    })
  })
})
