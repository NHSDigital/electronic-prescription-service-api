import pino from "pino"

const actualVerification = jest.requireActual("../../../../../src/services/verification/signature-verification")
let throwOnVerification = false
jest.mock("../../../../../src/services/verification/signature-verification", () => ({
  verifyPrescriptionSignature: (parentPrescription: hl7V3.ParentPrescription, logger: pino.Logger) => {
    if (throwOnVerification) {
      throw new Error("Verification error")
    } else {
      return actualVerification.verifyPrescriptionSignature(parentPrescription, logger)
    }
  }
}))

import {
  translateReleaseResponse,
  TranslationResponseResult
} from "../../../../../src/services/translation/response/release/release-response"
import {createBundle} from "../../../../../src/services/translation/common/response-bundles"
import * as LosslessJson from "lossless-json"
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
import {Organization as IOrganisation} from "../../../../../../models/fhir/practitioner-role"
import {setSubcaccCertEnvVar} from "../../../../../tests/resources/test-helpers"
import {getExamplePrescriptionReleaseResponse} from "../../../../resources/test-resources"
import {DispenseProposalReturnFactory} from "../../../../../src/services/translation/request/return/return-factory"

const logger = pino()
const returnFactory = new DispenseProposalReturnFactory()

const setupMockData = async (releaseExampleName: string): Promise<TranslationResponseResult> => {
  const result = await translateReleaseResponse(
    getExamplePrescriptionReleaseResponse(releaseExampleName),
    logger,
    returnFactory
  )

  return result
}

describe("outer bundle", () => {
  let loggerSpy: jest.SpyInstance
  let returnFactoryCreateFunctionSpy: jest.SpyInstance

  let result: TranslationResponseResult
  let prescriptionsParameter: fhir.ResourceParameter<fhir.Bundle>
  let prescriptions: fhir.Bundle

  setSubcaccCertEnvVar("../resources/certificates/NHS_INT_Level1D_Base64_pem.cer")

  function getBeforeAllCallback(mockDataParameter: string, bundleParameter: string): jest.ProvidesHookCallback {
    return async () => {
      loggerSpy = jest.spyOn(logger, "error")
      returnFactoryCreateFunctionSpy = jest.spyOn(returnFactory, "create")

      result = await setupMockData(mockDataParameter)
      prescriptionsParameter = getBundleParameter(result.translatedResponse, bundleParameter)
      prescriptions = prescriptionsParameter.resource
    }
  }

  function afterAllCallback() {
    loggerSpy.mockRestore()
    returnFactoryCreateFunctionSpy.mockRestore()
  }

  function commonTests(expectedTotal: number, expectedEntries: Array<string>) {
    test("contains id", () => {
      expect(prescriptions.id).toBeTruthy()
    })

    test("contains meta with correct value", () => {
      expect(prescriptions.meta).toEqual({
        lastUpdated: "2022-12-12T10:11:22+00:00"
      })
    })

    test("contains identifier with correct value", () => {
      expect(prescriptions.identifier).toEqual({
        system: "https://tools.ietf.org/html/rfc4122",
        value: "0d39c29d-ec49-4046-965e-588f5df6970e"
      })
    })

    test("contains type with correct value", () => {
      expect(prescriptions.type).toEqual("searchset")
    })

    test("contains total with correct value", () => {
      expect(prescriptions.total).toEqual(expectedTotal)
    })

    test(`contains entry containing only ${expectedEntries.join(", and")}`, () => {
      const resourceTypes = prescriptions.entry.map((entry) => entry.resource.resourceType)
      expect(resourceTypes).toEqual(expectedEntries)
    })

    test("can be converted", () => {
      expect(() => LosslessJson.stringify(result)).not.toThrow()
    })
  }

  describe("passed prescriptions", () => {
    beforeAll(getBeforeAllCallback("release_success.xml", "passedPrescriptions"))

    afterAll(afterAllCallback)

    commonTests(1, ["Bundle"])

    test("does not log any errors", () => {
      expect(loggerSpy).toHaveBeenCalledTimes(0)
    })

    test("verify factory to create dispenseProposalReturn is not called", () => {
      expect(returnFactoryCreateFunctionSpy).not.toHaveBeenCalled()
    })
  })

  describe("failed prescriptions", () => {
    beforeAll(getBeforeAllCallback("release_invalid.xml", "failedPrescriptions"))

    afterAll(afterAllCallback)

    commonTests(2, ["OperationOutcome", "Bundle"])

    test("entry containing operation outcome has fullUrl with a defined uuid", () => {
      const operationOutcomeEntries = prescriptions.entry.filter(
        (entry) => entry.resource.resourceType === "OperationOutcome"
      )
      expect(operationOutcomeEntries.length).toEqual(1)

      const operationOutcomeEntry = operationOutcomeEntries[0]
      expect(operationOutcomeEntry.fullUrl).toBeDefined()
      expect(operationOutcomeEntry.fullUrl).not.toEqual("urn:uuid:undefined")
    })

    test("logs an error", () => {
      expect(loggerSpy).toHaveBeenCalledWith(
        "[Verifying signature for prescription ID 93041e69-2017-4242-b325-cbc9a84d5ef1]: Signature is invalid"
      )
    })

    describe("operation outcome", () => {
      let operationOutcome: fhir.OperationOutcome

      beforeAll(async () => {
        operationOutcome = prescriptions.entry[0].resource as fhir.OperationOutcome
      })

      test("contains bundle reference extension", () => {
        expect(operationOutcome.extension[0].url).toEqual(
          "https://fhir.nhs.uk/StructureDefinition/Extension-Spine-supportingInfo-prescription"
        )
      })

      test("contains bundle reference value", () => {
        const prescription = prescriptions.entry[1].resource as fhir.Bundle
        const extension = operationOutcome.extension[0] as fhir.IdentifierReferenceExtension<fhir.Bundle>
        expect(extension.valueReference.identifier).toEqual(prescription.identifier)
      })

      test("contains an issue stating that the signature is invalid", () => {
        expect(operationOutcome.issue).toEqual([
          {
            severity: "error",
            code: "invalid",
            details: {
              coding: [
                {
                  system: "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
                  code: "INVALID_VALUE",
                  display: "Signature is invalid."
                }
              ]
            },
            expression: ["Provenance.signature.data"]
          }
        ])
      })

      test("verify dispenseProposalReturn factory is called once", () => {
        expect(returnFactoryCreateFunctionSpy).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe("when the release response message contains only old format prescriptions", () => {
    let result: TranslationResponseResult
    let prescriptionsParameter: fhir.ResourceParameter<fhir.Bundle>
    let prescriptions: fhir.Bundle

    setSubcaccCertEnvVar("../resources/certificates/NHS_INT_Level1D_Base64_pem.cer")

    beforeAll(async () => {
      const examplePrescriptionReleaseResponse = getExamplePrescriptionReleaseResponse("release_success.xml")
      toArray(examplePrescriptionReleaseResponse.component).forEach(
        (component) => (component.templateId._attributes.extension = "PORX_MT122003UK30")
      )

      result = await translateReleaseResponse(examplePrescriptionReleaseResponse, logger, returnFactory)
      prescriptionsParameter = getBundleParameter(result.translatedResponse, "passedPrescriptions")
      prescriptions = prescriptionsParameter.resource
    })

    test("contains total with correct value", () => {
      expect(prescriptions.total).toEqual(0)
    })

    test("contains entry which is empty", () => {
      expect(prescriptions.entry).toHaveLength(0)
    })
  })

  test("marks prescription as failed if verification throws an error", async () => {
    try {
      loggerSpy = jest.spyOn(logger, "error")
      throwOnVerification = true
      const result = await translateReleaseResponse(
        getExamplePrescriptionReleaseResponse("release_success.xml"),
        logger,
        returnFactory
      )
      prescriptionsParameter = getBundleParameter(result.translatedResponse, "failedPrescriptions")
      prescriptions = prescriptionsParameter.resource
      expect(prescriptions.total).toEqual(2)
      expect(loggerSpy).toHaveBeenCalledWith(expect.anything(), "Uncaught error during signature verification")
    } finally {
      loggerSpy.mockRestore()
      throwOnVerification = false
    }
  })
})

describe("inner bundle", () => {
  let result: fhir.Bundle

  beforeAll(async () => {
    result = await createBundle(getExampleParentPrescription(), "ReleaseRequestId", logger)
  })

  test("contains id", () => {
    expect(result.id).toBeTruthy()
  })

  test("contains meta with correct value", () => {
    expect(result.meta).toEqual({
      lastUpdated: "2022-12-12T00:00:00+00:00"
    })
  })

  test("contains identifier with correct value", () => {
    expect(result.identifier).toEqual({
      system: "https://tools.ietf.org/html/rfc4122",
      value: "93041e69-2017-4242-b325-cbc9a84d5ef1"
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
  let result: fhir.Bundle

  beforeAll(async () => {
    result = await createBundle(getExampleParentPrescription(), "ReleaseRequestId", logger)
  })

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
    const organisation: IOrganisation = organisations[0]
    expect(organisation.type).toBeUndefined()
  })

  test("contains MedicationRequests", () => {
    const medicationRequests = getMedicationRequests(result)
    expect(medicationRequests).toHaveLength(2)
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

  test("acute treatmentType causes intent = order", async () => {
    treatmentType.value = hl7V3.PrescriptionTreatmentTypeCode.ACUTE
    const result = await createBundle(parentPrescription, "ReleaseRequestId", logger)

    const medicationRequests = getMedicationRequests(result)

    medicationRequests.forEach((medicationRequest) => {
      expect(medicationRequest.intent).toBe(fhir.MedicationRequestIntent.ORDER)
    })
  })

  test("continuous treatmentType causes intent = order", async () => {
    treatmentType.value = hl7V3.PrescriptionTreatmentTypeCode.CONTINUOUS
    const result = await createBundle(parentPrescription, "ReleaseRequestId", logger)

    const medicationRequests = getMedicationRequests(result)

    medicationRequests.forEach((medicationRequest) => {
      expect(medicationRequest.intent).toBe(fhir.MedicationRequestIntent.ORDER)
    })
  })

  test("continuous repeat dispensing treatmentType causes intent = reflex-order", async () => {
    const parentPrescription = getExampleRepeatDispensingParentPrescription()
    treatmentType.value = hl7V3.PrescriptionTreatmentTypeCode.CONTINUOUS_REPEAT_DISPENSING
    const result = await createBundle(parentPrescription, "ReleaseRequestId", logger)

    const medicationRequests = getMedicationRequests(result)

    medicationRequests.forEach((medicationRequest) => {
      expect(medicationRequest.intent).toBe(fhir.MedicationRequestIntent.REFLEX_ORDER)
    })
  })
})

describe("practitioner details", () => {
  let parentPrescription: hl7V3.ParentPrescription
  let prescription: hl7V3.Prescription
  let result: fhir.Bundle

  beforeAll(async () => {
    parentPrescription = getExampleParentPrescription()
    prescription = parentPrescription.pertinentInformation1.pertinentPrescription
  })

  function setupAuthorAgentPerson(
    authorAttributeExtension: string,
    authorAttributeCode: string,
    authorAgentPersonIdExtension: string
  ) {
    prescription.author.AgentPerson.id._attributes.extension = authorAttributeExtension
    prescription.author.AgentPerson.code._attributes.code = authorAttributeCode
    prescription.author.AgentPerson.agentPerson.id._attributes.extension = authorAgentPersonIdExtension
  }

  function setupResponsiblePartyAgentPerson(
    responsiblePartyAttributeExtension: string,
    responsiblePartyAttributeCode: string,
    responsiblePartyAgentPersonIdExtension: string
  ) {
    prescription.responsibleParty.AgentPerson.id._attributes.extension = responsiblePartyAttributeExtension
    prescription.responsibleParty.AgentPerson.code._attributes.code = responsiblePartyAttributeCode
    prescription.responsibleParty.AgentPerson.agentPerson.id._attributes.extension =
      responsiblePartyAgentPersonIdExtension
  }

  function commonTests(expectedPractitionerRolesPresent: number, expectedPractitionersPresent: number) {
    test(`${expectedPractitionerRolesPresent} PractitionerRoles present`, () => {
      const practitionerRoles = getPractitionerRoles(result)
      expect(practitionerRoles).toHaveLength(expectedPractitionerRolesPresent)
    })

    test(`${expectedPractitionersPresent} Practitioners present`, () => {
      const practitioners = getPractitioners(result)
      expect(practitioners).toHaveLength(expectedPractitionersPresent)
    })
  }

  describe("when author and responsible party are different people or roles", () => {
    beforeAll(async () => {
      setupAuthorAgentPerson("AuthorRoleProfileId", "AuthorJobRoleCode", "AuthorProfessionalCode")
      setupResponsiblePartyAgentPerson(
        "ResponsiblePartyRoleProfileId",
        "ResponsiblePartyJobRoleCode",
        "ResponsiblePartyProfessionalCode"
      )
      result = await createBundle(parentPrescription, "ReleaseRequestId", logger)
    })

    commonTests(2, 2)
    test("requester PractitionerRole contains correct identifiers", () => {
      const requester = getRequester(result)
      const requesterIdentifiers = requester.identifier
      expect(requesterIdentifiers).toMatchObject([
        {
          system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
          value: "AuthorRoleProfileId"
        }
      ])
    })
    test("requester PractitionerRole contains correct JobRoleName", () => {
      const requester = getRequester(result)
      const requesterCodes = requester.code
      expect(requesterCodes).toMatchObject([
        {
          coding: [
            {
              system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
              code: "AuthorJobRoleCode"
            }
          ]
        }
      ])
    })
    test("requester PractitionerRole contains correct JobRoleCode", async () => {
      prescription.author.AgentPerson.code._attributes.code = "S0030:G0100:R0620"
      const jobRoleCodeResult = await createBundle(parentPrescription, "ReleaseRequestId", logger)

      const requester = getRequester(jobRoleCodeResult)
      const requesterCodes = requester.code
      expect(requesterCodes).toMatchObject([
        {
          coding: [
            {
              system: "https://fhir.nhs.uk/CodeSystem/NHSDigital-SDS-JobRoleCode",
              code: "S0030:G0100:R0620"
            }
          ]
        }
      ])
    })
    test("requester PractitionerRole contains correct JobRole Display Name", async () => {
      prescription.author.AgentPerson.code._attributes.code = "S0030:G0100:R0620"
      const jobRoleCodeResult = await createBundle(parentPrescription, "ReleaseRequestId", logger)

      const requester = getRequester(jobRoleCodeResult)
      const requesterCodes = requester.code
      expect(requesterCodes).toMatchObject([
        {
          coding: [
            {
              system: "https://fhir.nhs.uk/CodeSystem/NHSDigital-SDS-JobRoleCode",
              display: "Staff Nurse"
            }
          ]
        }
      ])
    })
    test("responsible practitioner PractitionerRole contains correct identifiers", () => {
      const responsiblePractitioner = getResponsiblePractitioner(result)
      const responsiblePractitionerIdentifiers = responsiblePractitioner.identifier
      expect(responsiblePractitionerIdentifiers).toMatchObject([
        {
          system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
          value: "ResponsiblePartyRoleProfileId"
        }
      ])
    })

    test("requester PractitionerRole contains correct codes", () => {
      const responsiblePractitioner = getResponsiblePractitioner(result)
      const responsiblePractitionerCodes = responsiblePractitioner.code
      expect(responsiblePractitionerCodes).toMatchObject([
        {
          coding: [
            {
              system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
              code: "ResponsiblePartyJobRoleCode"
            }
          ]
        }
      ])
    })

    test("requester Practitioner contains correct identifiers", () => {
      const requesterPractitionerRole = getRequester(result)
      const requesterPractitioner = resolvePractitioner(result, requesterPractitionerRole.practitioner)
      const requesterPractitionerIdentifiers = requesterPractitioner.identifier
      expect(requesterPractitionerIdentifiers).toMatchObject([
        {
          system: "https://fhir.hl7.org.uk/Id/professional-code",
          value: "AuthorProfessionalCode"
        }
      ])
    })
    test("responsible practitioner Practitioner contains correct identifiers", () => {
      const respPracPractitionerRole = getResponsiblePractitioner(result)
      const respPracPractitioner = resolvePractitioner(result, respPracPractitionerRole.practitioner)
      const respPracPractitionerIdentifiers = respPracPractitioner.identifier
      expect(respPracPractitionerIdentifiers).toMatchObject([
        {
          system: "https://fhir.hl7.org.uk/Id/professional-code",
          value: "ResponsiblePartyProfessionalCode"
        }
      ])
    })

    test("two Organizations present", () => {
      const organizations = getOrganizations(result)
      expect(organizations).toHaveLength(2)
    })

    test("requester Organization contains correct identifiers", () => {
      const requester = getRequester(result)
      const requesterOrganization = resolveOrganization(result, requester)
      const requesterOrganizationIdentifiers = requesterOrganization.identifier
      expect(requesterOrganizationIdentifiers).toMatchObject([
        {
          system: "https://fhir.nhs.uk/Id/ods-organization-code",
          value: "A83008"
        }
      ])
    })
  })

  describe("when author and responsible party are the same person and role", () => {
    beforeAll(async () => {
      setupAuthorAgentPerson("CommonRoleProfileId", "CommonJobRoleCode", "ProfessionalCode1")
      setupResponsiblePartyAgentPerson("CommonRoleProfileId", "CommonJobRoleCode", "ProfessionalCode2")
      result = await createBundle(parentPrescription, "ReleaseRequestId", logger)
    })

    commonTests(1, 1)

    test("PractitionerRole contains correct identifiers", () => {
      const requester = getRequester(result)
      const requesterIdentifiers = requester.identifier
      expect(requesterIdentifiers).toMatchObject([
        {
          system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
          value: "CommonRoleProfileId"
        }
      ])
    })
    test("PractitionerRole contains correct codes", () => {
      const requester = getRequester(result)
      const requesterCodes = requester.code
      expect(requesterCodes).toMatchObject([
        {
          coding: [
            {
              system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
              code: "CommonJobRoleCode"
            }
          ]
        }
      ])
    })
    test("PractitionerRole does not contain HealthcareService reference", () => {
      const requester = getRequester(result)
      expect(requester.healthcareService).toBeUndefined()
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
      expect(requesterOrganizationIdentifiers).toMatchObject([
        {
          system: "https://fhir.nhs.uk/Id/ods-organization-code",
          value: "A83008"
        }
      ])
    })
  })

  describe("when responsible party contains a spurious code", () => {
    beforeAll(async () => {
      setupAuthorAgentPerson("CommonRoleProfileId", "CommonJobRoleCode", "G1234567")
      setupResponsiblePartyAgentPerson("CommonRoleProfileId", "CommonJobRoleCode", "612345")
      result = await createBundle(parentPrescription, "ReleaseRequestId", logger)
    })

    commonTests(1, 1)

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
      expect(requesterCodes).toMatchObject([
        {
          coding: [
            {
              system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
              code: "CommonJobRoleCode"
            }
          ]
        }
      ])
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

  describe("when responsible party contains no code or id", () => {
    beforeAll(async () => {
      setupAuthorAgentPerson("AuthorRoleProfileId", "AuthorJobRoleCode", "G1234567")
      delete prescription.responsibleParty.AgentPerson.id
      delete prescription.responsibleParty.AgentPerson.code
      prescription.responsibleParty.AgentPerson.agentPerson.id._attributes.extension = "ProfessionalCode"
      result = await createBundle(parentPrescription, "ReleaseRequestId", logger)
    })

    commonTests(2, 2)

    test("PractitionerRole contains no identifier", () => {
      const respPracPractitionerRole = getResponsiblePractitioner(result)
      expect(respPracPractitionerRole.identifier).toBeFalsy()
    })
    test("PractitionerRole contains no code", () => {
      const respPracPractitionerRole = getResponsiblePractitioner(result)
      expect(respPracPractitionerRole.code).toBeFalsy()
    })
  })

  test("when responsible party contains no id but there is a spurious code", async () => {
    setupAuthorAgentPerson("AuthorRoleProfileId", "AuthorJobRoleCode", "G1234567")
    delete prescription.responsibleParty.AgentPerson.id
    delete prescription.responsibleParty.AgentPerson.code
    prescription.responsibleParty.AgentPerson.agentPerson.id._attributes.extension = "612345"
    result = await createBundle(parentPrescription, "ReleaseRequestId", logger)
    const respPracPractitionerRole = getResponsiblePractitioner(result)
    expect(respPracPractitionerRole.identifier).toMatchObject([
      {
        system: "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code",
        value: "612345"
      }
    ])
  })
})

function getExampleParentPrescription(): hl7V3.ParentPrescription {
  return toArray(getExamplePrescriptionReleaseResponse("release_success.xml").component)[0].ParentPrescription
}

function getExampleRepeatDispensingParentPrescription(): hl7V3.ParentPrescription {
  return toArray(getExamplePrescriptionReleaseResponse("repeat_dispensing_release_success.xml").component)[0]
    .ParentPrescription
}
