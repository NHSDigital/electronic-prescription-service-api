import {
  createInnerBundle,
  translateReleaseResponse
} from "../../../../../src/services/translation/response/release/release-response"
import * as LosslessJson from "lossless-json"
import {getUniqueValues} from "../../../../../src/utils/collections"
import {
  resolveOrganization,
  resolvePractitioner,
  toArray,
  getBundleParameter
} from "../../../../../src/services/translation/common"
import {fhir, hl7V3} from "@models"
import {
  getLocations,
  getMedicationRequests,
  getMessageHeader,
  getOrganizations,
  getPatient,
  getPractitionerRoles,
  getPractitioners,
  getProvenances
} from "../../../../../src/services/translation/common/getResourcesOfType"
import {getRequester, getResponsiblePractitioner} from "../common.spec"
import {Organization as IOrgansation} from "../../../../../../models/fhir/practitioner-role"
import {getExamplePrescriptionReleaseResponse} from "../../../../resources/test-resources"

describe("outer bundle", () => {
  describe("passed prescriptions", () => {
    const logger = createMockLogger()
    const mockReturnfactory = createMockReturnFactory()
    const result = translateReleaseResponse(
      getExamplePrescriptionReleaseResponse("release_success.xml"),
      logger,
      mockReturnfactory)
    const prescriptionsParameter = getBundleParameter(result.translatedResponse, "passedPrescriptions")
    const prescriptions = prescriptionsParameter.resource
    test("contains id", () => {
      expect(prescriptions.id).toBeTruthy()
    })

    test("contains meta with correct value", () => {
      expect(prescriptions.meta).toEqual({
        lastUpdated: "2013-12-10T17:22:07+00:00"
      })
    })

    test("contains identifier with correct value", () => {
      expect(prescriptions.identifier).toEqual({
        system: "https://tools.ietf.org/html/rfc4122",
        value: "285e5cce-8bc8-a7be-6b05-675051da69b0"
      })
    })

    test("contains type with correct value", () => {
      expect(prescriptions.type).toEqual("searchset")
    })

    test("contains total with correct value", () => {
      expect(prescriptions.total).toEqual(1)
    })

    test("contains entry containing only bundles", () => {
      const resourceTypes = prescriptions.entry.map(entry => entry.resource.resourceType)
      expect(getUniqueValues(resourceTypes)).toEqual(["Bundle"])
    })

    test("can be converted", () => {
      expect(() => LosslessJson.stringify(result)).not.toThrow()
    })

    test("does not log any errors", () => {
      expect(logger.error).not.toHaveBeenCalled()
    })

    test("verify factory to create dispensePurposalReturn is not called", () => {
      expect(mockReturnfactory.create.mock.calls.length).toBe(0)
    })
  })

  describe("when the release response message contains only old format prescriptions", () => {
    const examplePrescriptionReleaseResponse = getExamplePrescriptionReleaseResponse("release_success.xml")
    toArray(examplePrescriptionReleaseResponse.component)
      .forEach(component => component.templateId._attributes.extension = "PORX_MT122003UK30")
    const result = translateReleaseResponse(
      examplePrescriptionReleaseResponse,
      createMockLogger(),
      createMockReturnFactory())
    const prescriptionsParameter = getBundleParameter(result.translatedResponse, "passedPrescriptions")
    const prescriptions = prescriptionsParameter.resource

    test("contains total with correct value", () => {
      expect(prescriptions.total).toEqual(0)
    })

    test("contains entry which is empty", () => {
      expect(prescriptions.entry).toHaveLength(0)
    })
  })

  describe("failed prescriptions", () => {
    const logger = createMockLogger()
    const mockReturnfactory = createMockReturnFactory()
    const result = translateReleaseResponse(
      getExamplePrescriptionReleaseResponse(
        "release_invalid.xml"),
      logger,
      mockReturnfactory)
    const prescriptionsParameter = getBundleParameter(result.translatedResponse, "failedPrescriptions")
    const prescriptions = prescriptionsParameter.resource
    test("contains id", () => {
      expect(prescriptions.id).toBeTruthy()
    })

    test("contains meta with correct value", () => {
      expect(prescriptions.meta).toEqual({
        lastUpdated: "2013-12-10T17:22:07+00:00"
      })
    })

    test("contains identifier with correct value", () => {
      expect(prescriptions.identifier).toEqual({
        system: "https://tools.ietf.org/html/rfc4122",
        value: "285e5cce-8bc8-a7be-6b05-675051da69b0"
      })
    })

    test("contains type with correct value", () => {
      expect(prescriptions.type).toEqual("searchset")
    })

    test("contains total with correct value", () => {
      expect(prescriptions.total).toEqual(2)
    })

    test("contains entry containing operation outcome and bundle", () => {
      const resourceTypes = prescriptions.entry.map(entry => entry.resource.resourceType)
      expect(resourceTypes).toEqual(["OperationOutcome", "Bundle"])
    })

    test("contains entry containing operation outcome and bundle", () => {
      const resourceTypes = prescriptions.entry.map(entry => entry.resource.resourceType)
      expect(resourceTypes).toEqual(["OperationOutcome", "Bundle"])
    })

    test("can be converted", () => {
      expect(() => LosslessJson.stringify(result)).not.toThrow()
    })

    test("logs an error", () => {
      expect(logger.error).toHaveBeenCalledWith(
        "[Verifying signature for prescription ID 83df678d-daa5-1a24-9776-14806d837ca7]: Signature is invalid")
    })

    describe("operation outcome", () => {
      const operationOutcome = prescriptions.entry[0].resource as fhir.OperationOutcome

      test("contains bundle reference extension", () => {
        expect(operationOutcome.extension[0].url).toEqual(
          "https://fhir.nhs.uk/StructureDefinition/Extension-Spine-supportingInfo-prescription")
      })

      test("contains bundle reference value", () => {
        const prescription = prescriptions.entry[1].resource as fhir.Bundle
        const extension = operationOutcome.extension[0] as fhir.IdentifierReferenceExtension<fhir.Bundle>
        expect(extension.valueReference.identifier).toEqual(prescription.identifier)
      })

      test("contains an issue stating that the signature is invalid", () => {
        expect(operationOutcome.issue).toEqual([{
          severity: "error",
          code: "invalid",
          details: {
            coding: [{
              system: "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
              code: "INVALID_VALUE",
              display: "Signature is invalid."
            }]
          },
          expression: ["Provenance.signature.data"]
        }])
      })

      test("verify dispensePurposalReturn factory is called once", () => {
        expect(mockReturnfactory.create.mock.calls.length).toBe(1)
      })
    })
  })
})

describe("inner bundle", () => {
  const result = createInnerBundle(getExampleParentPrescription(), "ReleaseRequestId")

  test("contains id", () => {
    expect(result.id).toBeTruthy()
  })

  test("contains meta with correct value", () => {
    expect(result.meta).toEqual({
      lastUpdated: "2013-11-21T12:11:00+00:00"
    })
  })

  test("contains identifier with correct value", () => {
    expect(result.identifier).toEqual({
      system: "https://tools.ietf.org/html/rfc4122",
      value: "83df678d-daa5-1a24-9776-14806d837ca7"
    })
  })

  test("contains type with correct value", () => {
    expect(result.type).toEqual("message")
  })

  test("contains entry", () => {
    expect(result.entry.length).toBeGreaterThan(0)
  })
})

describe("bundle resources", () => {
  const result = createInnerBundle(getExampleParentPrescription(), "ReleaseRequestId")

  test("contains MessageHeader", () => {
    expect(() => getMessageHeader(result)).not.toThrow()
  })

  test("first element is MessageHeader", () => {
    expect(result.entry[0].resource.resourceType).toEqual("MessageHeader")
  })

  test("contains Patient", () => {
    expect(() => getPatient(result)).not.toThrow()
  })

  test("contains PractitionerRole", () => {
    const practitionerRoles = getPractitionerRoles(result)
    expect(practitionerRoles).toHaveLength(1)
  })

  test("contains Practitioner", () => {
    const practitioners = getPractitioners(result)
    expect(practitioners).toHaveLength(1)
  })

  test("does not contain Location", () => {
    const locations = getLocations(result)
    expect(locations).toHaveLength(0)
  })

  test("contains Organization", () => {
    const organizations = getOrganizations(result)
    expect(organizations).toHaveLength(1)
  })

  test("organisation should not contain a type field", () => {
    const organisations = getOrganizations(result)
    const organisation: IOrgansation = organisations[0]
    expect(organisation.type).toBeUndefined()
  })

  test("contains MedicationRequests", () => {
    const medicationRequests = getMedicationRequests(result)
    expect(medicationRequests).toHaveLength(4)
  })

  test("contains Provenance", () => {
    const provenances = getProvenances(result)
    expect(provenances).toHaveLength(1)
  })
})

describe("medicationRequest details", () => {
  const parentPrescription = getExampleParentPrescription()
  const prescription = parentPrescription.pertinentInformation1.pertinentPrescription
  const treatmentType = prescription.pertinentInformation5.pertinentPrescriptionTreatmentType

  test("acute treatmentType causes intent = order", () => {
    treatmentType.value = hl7V3.PrescriptionTreatmentTypeCode.ACUTE
    const result = createInnerBundle(parentPrescription, "ReleaseRequestId")

    const medicationRequests = getMedicationRequests(result)

    medicationRequests.forEach(medicationRequest => {
      expect(medicationRequest.intent).toBe(fhir.MedicationRequestIntent.ORDER)
    })
  })

  test("continuous treatmentType causes intent = order", () => {
    treatmentType.value = hl7V3.PrescriptionTreatmentTypeCode.CONTINUOUS
    const result = createInnerBundle(parentPrescription, "ReleaseRequestId")

    const medicationRequests = getMedicationRequests(result)

    medicationRequests.forEach(medicationRequest => {
      expect(medicationRequest.intent).toBe(fhir.MedicationRequestIntent.ORDER)
    })
  })

  test("continuous repeat dispensing treatmentType causes intent = reflex-order", () => {
    const parentPrescription = getExampleRepeatDispensingParentPrescription()
    treatmentType.value = hl7V3.PrescriptionTreatmentTypeCode.CONTINUOUS_REPEAT_DISPENSING
    const result = createInnerBundle(parentPrescription, "ReleaseRequestId")

    const medicationRequests = getMedicationRequests(result)

    medicationRequests.forEach(medicationRequest => {
      expect(medicationRequest.intent).toBe(fhir.MedicationRequestIntent.REFLEX_ORDER)
    })
  })
})

describe("practitioner details", () => {
  describe("when author and responsible party are different people or roles", () => {
    const parentPrescription = getExampleParentPrescription()
    const prescription = parentPrescription.pertinentInformation1.pertinentPrescription
    prescription.author.AgentPerson.id._attributes.extension = "AuthorRoleProfileId"
    prescription.author.AgentPerson.code._attributes.code = "AuthorJobRoleCode"
    prescription.author.AgentPerson.agentPerson.id._attributes.extension = "AuthorProfessionalCode"
    prescription.responsibleParty.AgentPerson.id._attributes.extension = "ResponsiblePartyRoleProfileId"
    prescription.responsibleParty.AgentPerson.code._attributes.code = "ResponsiblePartyJobRoleCode"
    prescription.responsibleParty.AgentPerson.agentPerson.id._attributes.extension = "ResponsiblePartyProfessionalCode"

    const result = createInnerBundle(parentPrescription, "ReleaseRequestId")

    test("two PractitionerRoles present", () => {
      const practitionerRoles = getPractitionerRoles(result)
      expect(practitionerRoles).toHaveLength(2)
    })
    test("requester PractitionerRole contains correct identifiers", () => {
      const requester = getRequester(result)
      const requesterIdentifiers = requester.identifier
      expect(requesterIdentifiers).toMatchObject([{
        system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
        value: "AuthorRoleProfileId"
      }])
    })
    test("requester PractitionerRole contains correct JobRoleName", () => {
      const requester = getRequester(result)
      const requesterCodes = requester.code
      expect(requesterCodes).toMatchObject([{
        coding: [{
          system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
          code: "AuthorJobRoleCode"
        }]
      }])
    })
    test("requester PractitionerRole contains correct JobRoleCode", () => {
      prescription.author.AgentPerson.code._attributes.code = "S0030:G0100:R0620"
      const jobRoleCodeResult = createInnerBundle(parentPrescription, "ReleaseRequestId")

      const requester = getRequester(jobRoleCodeResult)
      const requesterCodes = requester.code
      expect(requesterCodes).toMatchObject([{
        coding: [{
          system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleCode",
          code: "S0030:G0100:R0620"
        }]
      }])
    })
    test("responsible practitioner PractitionerRole contains correct identifiers", () => {
      const responsiblePractitioner = getResponsiblePractitioner(result)
      const responsiblePractitionerIdentifiers = responsiblePractitioner.identifier
      expect(responsiblePractitionerIdentifiers).toMatchObject([{
        system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
        value: "ResponsiblePartyRoleProfileId"
      }])
    })

    test("requester PractitionerRole contains correct codes", () => {
      const responsiblePractitioner = getResponsiblePractitioner(result)
      const responsiblePractitionerCodes = responsiblePractitioner.code
      expect(responsiblePractitionerCodes).toMatchObject([{
        coding: [{
          system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
          code: "ResponsiblePartyJobRoleCode"
        }]
      }])
    })

    test("two Practitioners present", () => {
      const practitioners = getPractitioners(result)
      expect(practitioners).toHaveLength(2)
    })
    test("requester Practitioner contains correct identifiers", () => {
      const requesterPractitionerRole = getRequester(result)
      const requesterPractitioner = resolvePractitioner(result, requesterPractitionerRole.practitioner)
      const requesterPractitionerIdentifiers = requesterPractitioner.identifier
      expect(requesterPractitionerIdentifiers).toMatchObject([{
        system: "https://fhir.hl7.org.uk/Id/professional-code",
        value: "AuthorProfessionalCode"
      }])
    })
    test("responsible practitioner Practitioner contains correct identifiers", () => {
      const respPracPractitionerRole = getResponsiblePractitioner(result)
      const respPracPractitioner = resolvePractitioner(result, respPracPractitionerRole.practitioner)
      const respPracPractitionerIdentifiers = respPracPractitioner.identifier
      expect(respPracPractitionerIdentifiers).toMatchObject([{
        system: "https://fhir.hl7.org.uk/Id/professional-code",
        value: "ResponsiblePartyProfessionalCode"
      }])
    })

    test("two Organizations present", () => {
      const organizations = getOrganizations(result)
      expect(organizations).toHaveLength(2)
    })

    test("requester Organization contains correct identifiers", () => {
      const requester = getRequester(result)
      const requesterOrganization = resolveOrganization(result, requester)
      const requesterOrganizationIdentifiers = requesterOrganization.identifier
      expect(requesterOrganizationIdentifiers).toMatchObject([{
        system: "https://fhir.nhs.uk/Id/ods-organization-code",
        value: "B83002"
      }])
    })
  })

  describe("when author and responsible party are the same person and role", () => {
    const parentPrescription = getExampleParentPrescription()
    const prescription = parentPrescription.pertinentInformation1.pertinentPrescription
    prescription.author.AgentPerson.id._attributes.extension = "CommonRoleProfileId"
    prescription.author.AgentPerson.code._attributes.code = "CommonJobRoleCode"
    prescription.author.AgentPerson.agentPerson.id._attributes.extension = "ProfessionalCode1"
    prescription.responsibleParty.AgentPerson.id._attributes.extension = "CommonRoleProfileId"
    prescription.responsibleParty.AgentPerson.code._attributes.code = "CommonJobRoleCode"
    prescription.responsibleParty.AgentPerson.agentPerson.id._attributes.extension = "ProfessionalCode2"

    const result = createInnerBundle(parentPrescription, "ReleaseRequestId")

    test("one PractitionerRole present", () => {
      const practitionerRoles = getPractitionerRoles(result)
      expect(practitionerRoles).toHaveLength(1)
    })
    test("PractitionerRole contains correct identifiers", () => {
      const requester = getRequester(result)
      const requesterIdentifiers = requester.identifier
      expect(requesterIdentifiers).toMatchObject([{
        system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
        value: "CommonRoleProfileId"
      }])
    })
    test("PractitionerRole contains correct codes", () => {
      const requester = getRequester(result)
      const requesterCodes = requester.code
      expect(requesterCodes).toMatchObject([{
        coding: [{
          system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
          code: "CommonJobRoleCode"
        }]
      }])
    })
    test("PractitionerRole does not contain HealthcareService reference", () => {
      const requester = getRequester(result)
      expect(requester.healthcareService).toBeUndefined()
    })

    test("one Practitioner present", () => {
      const practitioners = getPractitioners(result)
      expect(practitioners).toHaveLength(1)
    })
    test("Practitioner contains correct identifiers", () => {
      const requesterPractitionerRole = getRequester(result)
      const requesterPractitioner = resolvePractitioner(result, requesterPractitionerRole.practitioner)
      const requesterPractitionerIdentifiers = requesterPractitioner.identifier
      expect(requesterPractitionerIdentifiers).toMatchObject([
        {
          system: "https://fhir.hl7.org.uk/Id/professional-code",
          value: "ProfessionalCode1"
        },
        {
          system: "https://fhir.hl7.org.uk/Id/professional-code",
          value: "ProfessionalCode2"
        }
      ])
    })

    test("one Organization present", () => {
      const organizations = getOrganizations(result)
      expect(organizations).toHaveLength(1)
    })
    test("Organization contains correct identifiers", () => {
      const requester = getRequester(result)
      const requesterOrganization = resolveOrganization(result, requester)
      const requesterOrganizationIdentifiers = requesterOrganization.identifier
      expect(requesterOrganizationIdentifiers).toMatchObject([{
        system: "https://fhir.nhs.uk/Id/ods-organization-code",
        value: "B83002"
      }])
    })
  })

  describe("when responsible party contains a spurious code", () => {
    const parentPrescription = getExampleParentPrescription()
    const prescription = parentPrescription.pertinentInformation1.pertinentPrescription
    prescription.author.AgentPerson.id._attributes.extension = "CommonRoleProfileId"
    prescription.author.AgentPerson.code._attributes.code = "CommonJobRoleCode"
    prescription.author.AgentPerson.agentPerson.id._attributes.extension = "G1234567"
    prescription.responsibleParty.AgentPerson.id._attributes.extension = "CommonRoleProfileId"
    prescription.responsibleParty.AgentPerson.code._attributes.code = "CommonJobRoleCode"
    prescription.responsibleParty.AgentPerson.agentPerson.id._attributes.extension = "612345"

    const result = createInnerBundle(parentPrescription, "ReleaseRequestId")

    test("one PractitionerRole present", () => {
      const practitionerRoles = getPractitionerRoles(result)
      expect(practitionerRoles).toHaveLength(1)
    })
    test("PractitionerRole contains correct identifiers (including spurious code)", () => {
      const requester = getRequester(result)
      const requesterIdentifiers = requester.identifier
      expect(requesterIdentifiers).toMatchObject([
        {
          system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
          value: "CommonRoleProfileId"
        },
        {
          system: "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code",
          value: "612345"
        }
      ])
    })
    test("PractitionerRole contains correct codes", () => {
      const requester = getRequester(result)
      const requesterCodes = requester.code
      expect(requesterCodes).toMatchObject([{
        coding: [{
          system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
          code: "CommonJobRoleCode"
        }]
      }])
    })

    test("one Practitioner present", () => {
      const practitioners = getPractitioners(result)
      expect(practitioners).toHaveLength(1)
    })
    test("Practitioner contains correct identifiers (no spurious code)", () => {
      const requesterPractitionerRole = getRequester(result)
      const requesterPractitioner = resolvePractitioner(result, requesterPractitionerRole.practitioner)
      const requesterPractitionerIdentifiers = requesterPractitioner.identifier
      expect(requesterPractitionerIdentifiers).toMatchObject([
        {
          system: "https://fhir.hl7.org.uk/Id/gmp-number",
          value: "G1234567"
        }
      ])
    })
  })
})

function createMockLogger() {
  return {
    level: "error",
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    fatal: jest.fn(),
    trace: jest.fn(),
    silent: jest.fn()
  }
}
function createMockReturnFactory() {
  return {
    create: jest.fn()
  }
}
function getExampleParentPrescription(): hl7V3.ParentPrescription {
  return toArray(getExamplePrescriptionReleaseResponse("release_success.xml").component)[0].ParentPrescription
}

function getExampleRepeatDispensingParentPrescription(): hl7V3.ParentPrescription {
  return toArray(
    getExamplePrescriptionReleaseResponse("repeat_dispensing_release_success.xml").component
  )[0].ParentPrescription
}
