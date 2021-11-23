import {
  createInnerBundle,
  createOuterBundle
} from "../../../../../src/services/translation/response/release/release-response"
import {readXmlStripNamespace} from "../../../../../src/services/serialisation/xml"
import * as LosslessJson from "lossless-json"
import * as fs from "fs"
import * as path from "path"
import {getUniqueValues} from "../../../../../src/utils/collections"
import {resolveOrganization, resolvePractitioner, toArray} from "../../../../../src/services/translation/common"
import {fhir, hl7V3} from "@models"
import {
  getCommunicationRequests,
  getHealthcareServices,
  getLists,
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
import {AdditionalInstructions, LineItemPertinentInformation1} from "../../../../../../models/hl7-v3"
import pino from "pino"

const logger = pino()

describe("outer bundle", () => {
  const resultPromise = createOuterBundle(getExamplePrescriptionReleaseResponse(), logger)

  test("contains id", async () => {
    const result = await resultPromise
    expect(result.id).toBeTruthy()
  })

  test("contains meta with correct value", async () => {
    const result = await resultPromise
    expect(result.meta).toEqual({
      lastUpdated: "2021-11-23T14:17:37+00:00"
    })
  })

  test("contains identifier with correct value", async () => {
    const result = await resultPromise
    expect(result.identifier).toEqual({
      system: "https://tools.ietf.org/html/rfc4122",
      value: "c0f11c0d-28d3-460f-a1b9-e65d60cb8154"
    })
  })

  test("contains type with correct value", async () => {
    const result = await resultPromise
    expect(result.type).toEqual("searchset")
  })

  test("contains total with correct value", async () => {
    const result = await resultPromise
    expect(result.total).toEqual(1)
  })

  test("contains entry containing only bundles", async () => {
    const result = await resultPromise
    const resourceTypes = result.entry.map(entry => entry.resource.resourceType)
    expect(getUniqueValues(resourceTypes)).toEqual(["Bundle"])
  })

  test("can be converted", async () => {
    const result = await resultPromise
    expect(() => LosslessJson.stringify(result)).not.toThrow()
  })

  describe("when the release response message contains only old format prescriptions", () => {
    const examplePrescriptionReleaseResponse = getExamplePrescriptionReleaseResponse()
    toArray(examplePrescriptionReleaseResponse.component)
      .forEach(component => component.templateId._attributes.extension = "PORX_MT122003UK30")
    const resultPromise = createOuterBundle(examplePrescriptionReleaseResponse, logger)

    test("contains total with correct value", async () => {
      const result = await resultPromise
      expect(result.total).toEqual(0)
    })

    test("contains entry which is empty", async () => {
      const result = await resultPromise
      expect(result.entry).toHaveLength(0)
    })
  })
})

describe("inner bundle", () => {
  const resultPromise = createInnerBundle(getExampleParentPrescription(), "ReleaseRequestId", logger)

  test("contains id", async () => {
    const result = await resultPromise
    expect(result.id).toBeTruthy()
  })

  test("contains meta with correct value", async () => {
    const result = await resultPromise
    expect(result.meta).toEqual({
      lastUpdated: "2021-11-23T14:17:15+00:00"
    })
  })

  test("contains identifier with correct value", async () => {
    const result = await resultPromise
    expect(result.identifier).toEqual({
      system: "https://tools.ietf.org/html/rfc4122",
      value: "8d0ab726-7feb-4725-a5a8-e4afb5e21754"
    })
  })

  test("contains type with correct value", async () => {
    const result = await resultPromise
    expect(result.type).toEqual("message")
  })

  test("contains entry", async () => {
    const result = await resultPromise
    expect(result.entry.length).toBeGreaterThan(0)
  })
})

describe("bundle resources", () => {
  const resultPromise = createInnerBundle(getExampleParentPrescription(), "ReleaseRequestId", logger)

  test("contains MessageHeader", async () => {
    const result = await resultPromise
    expect(() => getMessageHeader(result)).not.toThrow()
  })

  test("first element is MessageHeader", async () => {
    const result = await resultPromise
    expect(result.entry[0].resource.resourceType).toEqual("MessageHeader")
  })

  test("contains Patient", async () => {
    const result = await resultPromise
    expect(() => getPatient(result)).not.toThrow()
  })

  test("contains PractitionerRole", async () => {
    const result = await resultPromise
    const practitionerRoles = getPractitionerRoles(result)
    expect(practitionerRoles).toHaveLength(1)
  })

  test("contains Practitioner", async () => {
    const result = await resultPromise
    const practitioners = getPractitioners(result)
    expect(practitioners).toHaveLength(1)
  })

  test("contains HealthcareService", async () => {
    const result = await resultPromise
    const healthcareServices = getHealthcareServices(result)
    expect(healthcareServices).toHaveLength(1)
  })

  test("contains Location", async () => {
    const result = await resultPromise
    const locations = getLocations(result)
    expect(locations).toHaveLength(1)
  })

  test("contains Organization", async () => {
    const result = await resultPromise
    const organizations = getOrganizations(result)
    expect(organizations).toHaveLength(1)
  })

  test("contains MedicationRequests", async () => {
    const result = await resultPromise
    const medicationRequests = getMedicationRequests(result)
    expect(medicationRequests).toHaveLength(2)
  })

  test("contains Provenance", async () => {
    const result = await resultPromise
    const provenances = getProvenances(result)
    expect(provenances).toHaveLength(1)
  })
})

describe("bundle resources with additional instructions", () => {
  const parent = getExampleParentPrescription()

  const lineItemInfoWrapper = parent.pertinentInformation1.pertinentPrescription.pertinentInformation2

  const lineItemInfo = Array.isArray(lineItemInfoWrapper) ? lineItemInfoWrapper[0] : lineItemInfoWrapper

  lineItemInfo.pertinentLineItem.pertinentInformation1 = new LineItemPertinentInformation1(
    new AdditionalInstructions(
      "<medication>Bendroflumethiazide 2.5mg tablets (3/6)</medication>"+
      "<medication>Salbutamol 100micrograms/dose inhaler CFC free (2/6)</medication>"+
      "<patientInfo>Due to Coronavirus restrictions Church View Surgery is CLOSED until further notice</patientInfo>"
    )
  )

  const resultPromise = createInnerBundle(parent, "ReleaseRequestId", logger)

  test("contains CommunicationRequest", async () => {
    const result = await resultPromise
    const additionalInstructions = getCommunicationRequests(result)
    expect(additionalInstructions).toHaveLength(1)
  })

  test("contains List", async () => {
    const result = await resultPromise
    const medicationAdditionalInstructions = getLists(result)
    expect(medicationAdditionalInstructions).toHaveLength(1)
    expect(medicationAdditionalInstructions[0].entry).toHaveLength(2)
  })
})

describe("medicationRequest details", () => {
  const parentPrescription = getExampleParentPrescription()
  const prescription = parentPrescription.pertinentInformation1.pertinentPrescription
  const treatmentType = prescription.pertinentInformation5.pertinentPrescriptionTreatmentType

  test("acute treatmentType causes intent = order", async () => {
    treatmentType.value = hl7V3.PrescriptionTreatmentTypeCode.ACUTE
    const result = await createInnerBundle(parentPrescription, "ReleaseRequestId", logger)

    const medicationRequests = getMedicationRequests(result)

    medicationRequests.forEach(medicationRequest => {
      expect(medicationRequest.intent).toBe(fhir.MedicationRequestIntent.ORDER)
    })
  })

  test("continuous treatmentType causes intent = order", async () => {
    treatmentType.value = hl7V3.PrescriptionTreatmentTypeCode.CONTINUOUS
    const result = await createInnerBundle(parentPrescription, "ReleaseRequestId", logger)

    const medicationRequests = getMedicationRequests(result)

    medicationRequests.forEach(medicationRequest => {
      expect(medicationRequest.intent).toBe(fhir.MedicationRequestIntent.ORDER)
    })
  })

  test("continuous repeat dispensing treatmentType causes intent = reflex-order", async () => {
    treatmentType.value = hl7V3.PrescriptionTreatmentTypeCode.CONTINUOUS_REPEAT_DISPENSING
    const result = await createInnerBundle(parentPrescription, "ReleaseRequestId", logger)

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

    const resultPromise = createInnerBundle(parentPrescription, "ReleaseRequestId", logger)

    test("two PractitionerRoles present", async () => {
      const result = await resultPromise
      const practitionerRoles = getPractitionerRoles(result)
      expect(practitionerRoles).toHaveLength(2)
    })
    test("requester PractitionerRole contains correct identifiers", async () => {
      const result = await resultPromise
      const requester = getRequester(result)
      const requesterIdentifiers = requester.identifier
      expect(requesterIdentifiers).toMatchObject([{
        system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
        value: "AuthorRoleProfileId"
      }])
    })
    test("requester PractitionerRole contains correct codes", async () => {
      const result = await resultPromise
      const requester = getRequester(result)
      const requesterCodes = requester.code
      expect(requesterCodes).toMatchObject([{
        coding: [{
          system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
          code: "AuthorJobRoleCode"
        }]
      }])
    })
    test("responsible practitioner PractitionerRole contains correct identifiers", async () => {
      const result = await resultPromise
      const responsiblePractitioner = getResponsiblePractitioner(result)
      const responsiblePractitionerIdentifiers = responsiblePractitioner.identifier
      expect(responsiblePractitionerIdentifiers).toMatchObject([{
        system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
        value: "ResponsiblePartyRoleProfileId"
      }])
    })

    test("requester PractitionerRole contains correct codes", async () => {
      const result = await resultPromise
      const responsiblePractitioner = getResponsiblePractitioner(result)
      const responsiblePractitionerCodes = responsiblePractitioner.code
      expect(responsiblePractitionerCodes).toMatchObject([{
        coding: [{
          system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
          code: "ResponsiblePartyJobRoleCode"
        }]
      }])
    })

    test("two Practitioners present", async () => {
      const result = await resultPromise
      const practitioners = getPractitioners(result)
      expect(practitioners).toHaveLength(2)
    })
    test("requester Practitioner contains correct identifiers", async () => {
      const result = await resultPromise
      const requesterPractitionerRole = getRequester(result)
      const requesterPractitioner = resolvePractitioner(result, requesterPractitionerRole.practitioner)
      const requesterPractitionerIdentifiers = requesterPractitioner.identifier
      expect(requesterPractitionerIdentifiers).toMatchObject([{
        system: "https://fhir.hl7.org.uk/Id/professional-code",
        value: "AuthorProfessionalCode"
      }])
    })
    test("responsible practitioner Practitioner contains correct identifiers", async () => {
      const result = await resultPromise
      const respPracPractitionerRole = getResponsiblePractitioner(result)
      const respPracPractitioner = resolvePractitioner(result, respPracPractitionerRole.practitioner)
      const respPracPractitionerIdentifiers = respPracPractitioner.identifier
      expect(respPracPractitionerIdentifiers).toMatchObject([{
        system: "https://fhir.hl7.org.uk/Id/professional-code",
        value: "ResponsiblePartyProfessionalCode"
      }])
    })

    test("two HealthcareServices present", async () => {
      const result = await resultPromise
      const healthcareServices = getHealthcareServices(result)
      expect(healthcareServices).toHaveLength(2)
    })
    test("two Locations present", async () => {
      const result = await resultPromise
      const locations = getLocations(result)
      expect(locations).toHaveLength(2)
    })

    test("two Organizations present", async () => {
      const result = await resultPromise
      const organizations = getOrganizations(result)
      expect(organizations).toHaveLength(2)
    })
    test("requester Organization contains correct identifiers", async () => {
      const result = await resultPromise
      const requester = getRequester(result)
      const requesterOrganization = resolveOrganization(result, requester)
      const requesterOrganizationIdentifiers = requesterOrganization.identifier
      expect(requesterOrganizationIdentifiers).toMatchObject([{
        system: "https://fhir.nhs.uk/Id/ods-organization-code",
        value: "RBA"
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

    const resultPromise = createInnerBundle(parentPrescription, "ReleaseRequestId", logger)

    test("one PractitionerRole present", async () => {
      const result = await resultPromise
      const practitionerRoles = getPractitionerRoles(result)
      expect(practitionerRoles).toHaveLength(1)
    })
    test("PractitionerRole contains correct identifiers", async () => {
      const result = await resultPromise
      const requester = getRequester(result)
      const requesterIdentifiers = requester.identifier
      expect(requesterIdentifiers).toMatchObject([{
        system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
        value: "CommonRoleProfileId"
      }])
    })
    test("PractitionerRole contains correct codes", async () => {
      const result = await resultPromise
      const requester = getRequester(result)
      const requesterCodes = requester.code
      expect(requesterCodes).toMatchObject([{
        coding: [{
          system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
          code: "CommonJobRoleCode"
        }]
      }])
    })

    test("one Practitioner present", async () => {
      const result = await resultPromise
      const practitioners = getPractitioners(result)
      expect(practitioners).toHaveLength(1)
    })
    test("Practitioner contains correct identifiers", async () => {
      const result = await resultPromise
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

    test("one HealthcareService present", async () => {
      const result = await resultPromise
      const healthcareServices = getHealthcareServices(result)
      expect(healthcareServices).toHaveLength(1)
    })
    test("one Location present", async () => {
      const result = await resultPromise
      const locations = getLocations(result)
      expect(locations).toHaveLength(1)
    })

    test("one Organization present", async () => {
      const result = await resultPromise
      const organizations = getOrganizations(result)
      expect(organizations).toHaveLength(1)
    })
    test("Organization contains correct identifiers", async () => {
      const result = await resultPromise
      const requester = getRequester(result)
      const requesterOrganization = resolveOrganization(result, requester)
      const requesterOrganizationIdentifiers = requesterOrganization.identifier
      expect(requesterOrganizationIdentifiers).toMatchObject([{
        system: "https://fhir.nhs.uk/Id/ods-organization-code",
        value: "RBA"
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
    prescription.responsibleParty.AgentPerson.agentPerson.id._attributes.extension = "G7123456"

    const resultPromise = createInnerBundle(parentPrescription, "ReleaseRequestId", logger)

    test("one PractitionerRole present", async () => {
      const result = await resultPromise
      const practitionerRoles = getPractitionerRoles(result)
      expect(practitionerRoles).toHaveLength(1)
    })
    test("PractitionerRole contains correct identifiers (including spurious code)", async () => {
      const result = await resultPromise
      const requester = getRequester(result)
      const requesterIdentifiers = requester.identifier
      expect(requesterIdentifiers).toMatchObject([
        {
          system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
          value: "CommonRoleProfileId"
        },
        {
          system: "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code",
          value: "G7123456"
        }
      ])
    })
    test("PractitionerRole contains correct codes", async () => {
      const result = await resultPromise
      const requester = getRequester(result)
      const requesterCodes = requester.code
      expect(requesterCodes).toMatchObject([{
        coding: [{
          system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
          code: "CommonJobRoleCode"
        }]
      }])
    })

    test("one Practitioner present", async () => {
      const result = await resultPromise
      const practitioners = getPractitioners(result)
      expect(practitioners).toHaveLength(1)
    })
    test("Practitioner contains correct identifiers (no spurious code)", async () => {
      const result = await resultPromise
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

export function getExamplePrescriptionReleaseResponse(): hl7V3.PrescriptionReleaseResponse {
  const exampleStr = fs.readFileSync(path.join(__dirname, "release_success.xml"), "utf8")
  const exampleObj = readXmlStripNamespace(exampleStr)
  return exampleObj.PORX_IN070103UK31.ControlActEvent.subject.PrescriptionReleaseResponse
}

function getExampleParentPrescription(): hl7V3.ParentPrescription {
  return toArray(getExamplePrescriptionReleaseResponse().component)[0].ParentPrescription
}
