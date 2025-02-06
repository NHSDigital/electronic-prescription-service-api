import * as validator from "../../../src/services/validation/bundle-validator"
import * as TestResources from "../../resources/test-resources"
import {clone} from "../../resources/test-helpers"
import {
  getMedicationRequests,
  getOrganizations,
  getPractitionerRoles
} from "../../../src/services/translation/common/getResourcesOfType"
import {
  getExtensionForUrl,
  getExtensionForUrlOrNull,
  isTruthy,
  resolveOrganization,
  resolvePractitioner,
  resolveReference
} from "../../../src/services/translation/common"
import {fhir, validationErrors as errors} from "@models"
import {
  DISPENSING_APP_SCOPE,
  DISPENSING_USER_SCOPE,
  PRESCRIBING_APP_SCOPE,
  PRESCRIBING_USER_SCOPE
} from "../../../src/services/validation/scope-validator"
import {isReference} from "../../../src/utils/type-guards"
import pino from "pino"

const logger = pino()
const loggerWarnSpy = jest.spyOn(logger, "warn")

function validateValidationErrors(validationErrors: Array<fhir.OperationOutcomeIssue>) {
  expect(validationErrors).toHaveLength(1)
  const validationError = validationErrors[0]
  expect(validationError.code).toEqual(fhir.IssueCodes.VALUE)
  expect(validationError.severity).toEqual("error")
}

describe("Bundle checks", () => {
  afterEach(() => {
    process.env.PRESCRIBE_ENABLED = "true"
    process.env.DISPENSE_ENABLED = "true"
  })

  test("rejects bundle with unsupported message type", () => {
    const messageHeader: fhir.MessageHeader = {
      resourceType: "MessageHeader",
      eventCoding: {
        system: undefined,
        code: "garbage-message-type" as fhir.EventCodingCode
      },
      focus: undefined,
      sender: undefined,
      source: undefined
    }
    const bundle: fhir.Bundle = {
      resourceType: "Bundle",
      id: "test-bundle",
      entry: [
        {
          resource: messageHeader
        }
      ]
    }
    const result = validator.verifyBundle(
      bundle as fhir.Bundle,
      PRESCRIBING_USER_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id",
      logger
    )
    expect(result).toContainEqual(errors.messageTypeIssue)
  })

  test("verifyBundle rejects a prescribe message when prescribe is disabled", () => {
    process.env.PRESCRIBE_ENABLED = "false"
    const result = validator.verifyBundle(
      TestResources.specification[0].fhirMessageUnsigned,
      PRESCRIBING_USER_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id",
      logger
    )
    expect(result).toEqual([errors.createDisabledFeatureIssue("Prescribing")])
  })

  test("verifyBundle rejects a dispense message when dispensing is disabled", () => {
    process.env.DISPENSE_ENABLED = "false"
    const result = validator.verifyBundle(
      TestResources.specification[2].fhirMessageDispense,
      DISPENSING_USER_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id",
      logger
    )
    expect(result).toEqual([errors.createDisabledFeatureIssue("Dispensing")])
  })

  test("verifyBundle accepts a dispense message when prescribe is disabled", () => {
    process.env.PRESCRIBE_ENABLED = "false"
    const result = validator.verifyBundle(
      TestResources.specification[2].fhirMessageDispense,
      DISPENSING_USER_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id",
      logger
    )
    expect(result).toEqual([])
  })

  test("verifyBundle accepts a dispense message when dispense is disabled", () => {
    process.env.DISPENSE_ENABLED = "false"
    const result = validator.verifyBundle(
      TestResources.specification[0].fhirMessageUnsigned,
      PRESCRIBING_USER_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id",
      logger
    )
    expect(result).toEqual([])
  })

  test("verifyBundle accepts a prescribe message when only prescribing user scope present", () => {
    const result = validator.verifyBundle(
      TestResources.specification[0].fhirMessageUnsigned,
      PRESCRIBING_USER_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id",
      logger
    )
    expect(result).toEqual([])
  })

  test("verifyBundle rejects a prescribe message when only prescribing app scope present", () => {
    const result = validator.verifyBundle(
      TestResources.specification[0].fhirMessageUnsigned,
      PRESCRIBING_APP_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id",
      logger
    )
    expect(result).toEqual([errors.createUserRestrictedOnlyScopeIssue("Prescribing")])
  })

  test("verifyBundle rejects a prescribe message when only dispensing user scope present", () => {
    const result = validator.verifyBundle(
      TestResources.specification[0].fhirMessageUnsigned,
      DISPENSING_USER_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id",
      logger
    )
    expect(result).toEqual([errors.createMissingScopeIssue("Prescribing")])
  })

  test("verifyBundle accepts a dispense message when only dispensing user scope present", () => {
    const result = validator.verifyBundle(
      TestResources.specification[2].fhirMessageDispense,
      DISPENSING_USER_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id",
      logger
    )
    expect(result).toEqual([])
  })

  test("verifyBundle rejects a dispense message when only dispensing app scope present", () => {
    const result = validator.verifyBundle(
      TestResources.specification[2].fhirMessageDispense,
      DISPENSING_APP_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id",
      logger
    )
    expect(result).toEqual([errors.createUserRestrictedOnlyScopeIssue("Dispensing")])
  })

  test("verifyBundle rejects a dispense message when only prescribing user scope present", () => {
    const result = validator.verifyBundle(
      TestResources.specification[2].fhirMessageDispense,
      PRESCRIBING_USER_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id",
      logger
    )
    expect(result).toEqual([errors.createMissingScopeIssue("Dispensing")])
  })

  test("verifyBundle accepts a message when multiple scopes are present, one of which is valid", () => {
    const result = validator.verifyBundle(
      TestResources.specification[0].fhirMessageUnsigned,
      `fake-testing-scope ${PRESCRIBING_APP_SCOPE} ${PRESCRIBING_USER_SCOPE}`,
      "test_sds_user_id",
      "test_sds_role_id",
      logger
    )
    expect(result).toEqual([])
  })
})

describe("verifyCommonBundle", () => {
  let bundle: fhir.Bundle
  let medicationRequests: Array<fhir.MedicationRequest>
  let practitionerRoles: Array<fhir.PractitionerRole>
  let organizations: Array<fhir.Organization>

  beforeEach(() => {
    bundle = clone(TestResources.specification[0].fhirMessageUnsigned)
    medicationRequests = getMedicationRequests(bundle)
    practitionerRoles = getPractitionerRoles(bundle)
    organizations = getOrganizations(bundle)
  })

  test("Should accept a prescription-order message where all MedicationRequests have intent order", () => {
    const validationErrors = validator.verifyCommonBundle(bundle, "test_sds_user_id", "test_sds_role_id", logger)
    expect(validationErrors).toHaveLength(0)
  })

  test("Should reject a message where one MedicationRequest has intent plan", () => {
    medicationRequests[0].intent = fhir.MedicationRequestIntent.PLAN
    const validationErrors = validator.verifyCommonBundle(bundle, "test_sds_user_id", "test_sds_role_id", logger)
    expect(validationErrors).toHaveLength(1)
    expect(validationErrors[0].expression).toContainEqual("Bundle.entry.resource.ofType(MedicationRequest).intent")
  })

  test("Should reject a message where all MedicationRequests have intent plan", () => {
    medicationRequests.forEach((medicationRequest) => (medicationRequest.intent = fhir.MedicationRequestIntent.PLAN))
    const validationErrors = validator.verifyCommonBundle(bundle, "test_sds_user_id", "test_sds_role_id", logger)
    expect(validationErrors).toHaveLength(1)
    expect(validationErrors[0].expression).toContainEqual("Bundle.entry.resource.ofType(MedicationRequest).intent")
  })

  test("Should reject a message where a MedicationRequest has both codeableConcept and reference", () => {
    const testCodeableConcept: fhir.CodeableConcept = {
      coding: []
    }
    const testReference: fhir.Reference<fhir.Medication> = {
      reference: "urn:uuid:test"
    }
    medicationRequests[0].medicationCodeableConcept = testCodeableConcept
    medicationRequests[0].medicationReference = testReference
    const validationErrors = validator.verifyCommonBundle(bundle, "test_sds_user_id", "test_sds_role_id", logger)
    expect(validationErrors).toHaveLength(1)
  })

  test("Should reject a message where False feature flag doesn't match PractitionerRole", () => {
    const testReference: fhir.IdentifierReference<fhir.Practitioner> = {
      identifier: {
        value: "test"
      }
    }
    practitionerRoles[0].practitioner = testReference
    practitionerRoles[0].organization = testReference
    practitionerRoles[0].healthcareService = [testReference]

    const validationErrors = validator.verifyCommonBundle(bundle, "test_sds_user_id", "test_sds_role_id", logger)
    expect(validationErrors).toHaveLength(3)
  })

  test("logger warn when inconsistent accessToken and body SDS user unique ID", () => {
    validator.verifyCommonBundle(bundle, "test_sds_user_id", "100102238986", logger)
    expect(loggerWarnSpy).toHaveBeenCalledWith({
      accessTokenSDSUserID: "test_sds_user_id",
      bodySDSUserID: "3415870201"
    },
    "SDS Unique User ID does not match between access token and message body"
    )
  })

  test("logger warn when inconsistent accessToken and body SDS role profile ID", () => {
    validator.verifyCommonBundle(bundle, "3415870201", "test_sds_role_id", logger)
    expect(loggerWarnSpy).toHaveBeenCalledWith({
      accessTokenSDSRoleID: "test_sds_role_id",
      bodySDSRoleID: "100102238986"
    },
    "SDS Role ID does not match between access token and message body"
    )
  })

  test("logger will not warn when SDS User ID is missing", () => {
    const testReference: Array<fhir.Identifier> = [
      {
        system: "https://fhir.hl7.org.uk/Id/gmc-number",
        value: "6095103"
      },
      {
        system: "https://fhir.hl7.org.uk/Id/din-number",
        value: "977677"
      }
    ]
    const practitioner = resolvePractitioner(bundle, practitionerRoles[0].practitioner)
    practitioner.identifier = testReference

    validator.verifyCommonBundle(bundle, "test_sds_user_id", "test_sds_role_id", logger)

    expect(loggerWarnSpy).not.toHaveBeenCalledWith({
      accessTokenSDSRoleID: "test_sds_role_id",
      bodySDSRoleID: "test_sds_role_id"
    },
    "SDS Role ID does not match between access token and message body"
    )
  })

  test("Should accept a practitionerRole with org-only responsible party", () => {
    const bundle = clone(TestResources.specification[6].fhirMessageUnsigned)

    const validationErrors = validator.verifyCommonBundle(bundle, "test_sds_user_id", "test_sds_role_id", logger)
    expect(validationErrors).toHaveLength(0)
  })

  test("Should reject a telecom with no use", () => {
    const telecom = {
      system: "phone",
      value: "01234567890"
    }
    organizations[0].telecom = [telecom]

    const validationErrors = validator.verifyCommonBundle(bundle, "test_sds_user_id", "test_sds_role_id", logger)
    expect(validationErrors).toHaveLength(1)
    expect(validationErrors[0].diagnostics).toEqual(
      "Required field bundle.entry[8].resource.telecom[0].use is missing."
    )
  })

  test("Should reject a telecom with no value", () => {
    const telecom = {
      system: "phone",
      use: "work"
    }
    organizations[0].telecom = [telecom]

    const validationErrors = validator.verifyCommonBundle(bundle, "test_sds_user_id", "test_sds_role_id", logger)
    expect(validationErrors).toHaveLength(1)
    expect(validationErrors[0].diagnostics).toEqual(
      "Required field bundle.entry[8].resource.telecom[0].value is missing."
    )
  })
})

describe("verifyPrescriptionBundle status check", () => {
  let bundle: fhir.Bundle
  let medicationRequests: Array<fhir.MedicationRequest>

  beforeEach(() => {
    bundle = clone(TestResources.specification[0].fhirMessageUnsigned)
    medicationRequests = getMedicationRequests(bundle)
  })

  test("Should accept a message where all MedicationRequests have status active", () => {
    const validationErrors = validator.verifyPrescriptionBundle(bundle)
    expect(validationErrors).toHaveLength(0)
  })

  test("Should reject a message where one MedicationRequest has status cancelled", () => {
    medicationRequests[0].status = fhir.MedicationRequestStatus.CANCELLED
    const validationErrors = validator.verifyPrescriptionBundle(bundle)
    expect(validationErrors).toHaveLength(1)
    expect(validationErrors[0].expression).toContainEqual("Bundle.entry.resource.ofType(MedicationRequest).status")
  })

  test("Should reject a message where all MedicationRequests have status cancelled", () => {
    medicationRequests.forEach(
      (medicationRequest) => (medicationRequest.status = fhir.MedicationRequestStatus.CANCELLED)
    )
    const validationErrors = validator.verifyPrescriptionBundle(bundle)
    expect(validationErrors).toHaveLength(1)
    expect(validationErrors[0].expression).toContainEqual("Bundle.entry.resource.ofType(MedicationRequest).status")
  })
})

describe("MedicationRequest consistency checks", () => {
  let bundle: fhir.Bundle
  let medicationRequests: Array<fhir.MedicationRequest>
  let practitionerRoles: Array<fhir.PractitionerRole>

  beforeEach(() => {
    bundle = clone(TestResources.specification[0].fhirMessageUnsigned)
    medicationRequests = getMedicationRequests(bundle)
    practitionerRoles = getPractitionerRoles(bundle)
  })

  test("Should cater for optional/missing extensions for MedicationRequests in consistency check", () => {
    medicationRequests.forEach((medicationRequest) => (medicationRequest.dispenseRequest.extension = []))

    const returnedError = validator.verifyIdenticalForAllMedicationRequests(
      bundle,
      medicationRequests,
      'dispenseRequest.extension("https://fhir.nhs.uk/StructureDefinition/Extension-DM-PerformerSiteType")'
    )

    expect(returnedError).toBe(null)
  })

  test("Should accept message where authoredOn is not included", () => {
    medicationRequests.forEach((medicationRequest) => (delete medicationRequest.authoredOn))

    const validationErrors = validator.verifyPrescriptionBundle(bundle)
    expect(validationErrors).toHaveLength(0)
  })

  test("Should reject message where MedicationRequests have different authoredOn", () => {
    const defaultAuthoredOn = "2020-01-02T00:00:00.000Z"
    medicationRequests.forEach((medicationRequest) => (medicationRequest.authoredOn = defaultAuthoredOn))
    const differentAuthoredOn = "2020-01-01T00:00:00.000Z"
    medicationRequests[0].authoredOn = differentAuthoredOn

    const validationErrors = validator.verifyPrescriptionBundle(bundle)

    expect(validationErrors).toContainEqual(
      errors.createMedicationRequestInconsistentValueIssue("authoredOn", [differentAuthoredOn, defaultAuthoredOn])
    )
  })

  test("Should reject message where MedicationRequests have different dispenseRequest.performer", () => {
    const performerExtension: fhir.ReferenceExtension<fhir.PractitionerRole> = {
      valueReference: {reference: ""},
      url: ""
    }
    const performer: fhir.Performer = {
      identifier: {
        system: "system",
        value: "value"
      },
      extension: [performerExtension]
    }
    const performerDiff: fhir.Performer = {
      identifier: {
        system: "system2",
        value: "value2"
      },
      extension: [performerExtension]
    }

    medicationRequests.forEach((medicationRequest) => (medicationRequest.dispenseRequest.performer = performer))
    medicationRequests[3].dispenseRequest.performer = performerDiff

    const validationErrors = validator.verifyPrescriptionBundle(bundle)

    validateValidationErrors(validationErrors)
    expect(validationErrors).toContainEqual(
      errors.createMedicationRequestInconsistentValueIssue("dispenseRequest.performer", [performer, performerDiff])
    )
  })

  test("Null should contribute to the count of unique values", () => {
    medicationRequests[0].groupIdentifier = null

    const validationErrors = validator.verifyPrescriptionBundle(bundle)

    validateValidationErrors(validationErrors)
  })

  test("Undefined should contribute to the count of unique values", () => {
    medicationRequests[0].groupIdentifier = undefined

    const validationErrors = validator.verifyPrescriptionBundle(bundle)

    validateValidationErrors(validationErrors)
  })

  test("Should reject message where 2 or more medication requests share an identifier", () => {
    const identifier: Array<fhir.Identifier> = [
      {
        system: "https://fhir.nhs.uk/Id/prescription-order-item-number",
        value: "a54219b8-f741-4c47-b662-e4f8dfa49ab5"
      }
    ]

    medicationRequests.forEach((medicationRequest) => (medicationRequest.identifier = identifier))

    const validationErrors = validator.verifyPrescriptionBundle(bundle)

    validateValidationErrors(validationErrors)
    expect(validationErrors).toContainEqual(errors.medicationRequestDuplicateIdentifierIssue)
  })

  test("Should throw error when PrescriptionType is 01nn and healthcareService exists", () => {
    const prescriptionTypeExtension = getExtensionForUrlOrNull(
      medicationRequests[0].extension,
      "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType",
      'Entry("MedicationRequest").extension("https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType")'
    ) as fhir.CodingExtension
    prescriptionTypeExtension.valueCoding.code = "0101"

    const validationErrors = validator.verifyPrescriptionBundle(bundle)
    expect(validationErrors).toHaveLength(1)
  })

  test("Should throw error when PrescriptionType is 01nn and partOf doesn't exist", () => {
    const prescriptionTypeExtension = getExtensionForUrlOrNull(
      medicationRequests[0].extension,
      "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType",
      'Entry("MedicationRequest").extension("https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType")'
    ) as fhir.CodingExtension
    prescriptionTypeExtension.valueCoding.code = "0101"

    delete practitionerRoles[0].healthcareService

    const organization = resolveOrganization(bundle, practitionerRoles[0])
    delete organization.partOf

    const validationErrors = validator.verifyPrescriptionBundle(bundle)
    expect(validationErrors).toHaveLength(2)
  })

  test("Should not throw an error when PrescriptionType is 1nnn and healthcareService doesn't exist", () => {
    delete practitionerRoles[0].healthcareService

    const validationErrors = validator.verifyPrescriptionBundle(bundle)
    expect(validationErrors).toHaveLength(0)
  })

  test("Should not throw an error when PrescriptionType is 1nnn and healthcareService does exist", () => {
    const validationErrors = validator.verifyPrescriptionBundle(bundle)
    expect(validationErrors).toHaveLength(0)
  })

  test("Should not throw error when PrescriptionType is 1nnn and partOf exists", () => {
    const organization = resolveOrganization(bundle, practitionerRoles[0])
    organization.partOf = {
      identifier: {
        system: "https://fhir.nhs.uk/Id/ods-organization-code",
        value: "84H"
      },
      display: "NHS COUNTY DURHAM CCG"
    }

    const validationErrors = validator.verifyPrescriptionBundle(bundle)
    expect(validationErrors).toHaveLength(0)
  })

  test("Should throw error when GMP-number is only number in Practitioner.identifier", () => {
    const testReference: fhir.Identifier = fhir.createIdentifier("https://fhir.hl7.org.uk/Id/gmp-number", "G1234567")
    if (isReference(practitionerRoles[0].practitioner)) {
      const practitioner = resolveReference(bundle, practitionerRoles[0].practitioner)
      practitioner.identifier = [testReference]
    }

    const validationErrors = validator.verifyPrescriptionBundle(bundle)
    expect(validationErrors).toHaveLength(1)

    expect(validationErrors[0].diagnostics).toEqual(
      "Bundle resource Practitioner.identifier expected " +
        "exactly one professional code from GMC|NMC|GPhC|HCPC|professional-code."
    )
  })
})

describe("verifyRepeatDispensingPrescription", () => {
  let bundle: fhir.Bundle
  let medicationRequests: Array<fhir.MedicationRequest>
  let firstMedicationRequest: fhir.MedicationRequest

  beforeEach(() => {
    bundle = clone(TestResources.specification[0].fhirMessageUnsigned)
    medicationRequests = getMedicationRequests(bundle)
    medicationRequests.forEach(
      (req) => (req.courseOfTherapyType.coding[0].code = fhir.CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING)
    )
    firstMedicationRequest = medicationRequests[0]
  })

  test("Acute prescription gets no additional errors added", () => {
    medicationRequests.forEach((req) => {
      req.courseOfTherapyType.coding[0].code = fhir.CourseOfTherapyTypeCode.ACUTE
      delete req.dispenseRequest.validityPeriod
      delete req.dispenseRequest.expectedSupplyDuration
    })

    const returnedErrors = validator.verifyPrescriptionBundle(bundle)
    expect(returnedErrors.length).toBe(0)
  })

  test("Repeat prescription with no dispenseRequest.validityPeriod adds an error", () => {
    delete firstMedicationRequest.dispenseRequest.validityPeriod
    const returnedErrors = validator.verifyRepeatDispensingPrescription(bundle, medicationRequests)
    expect(returnedErrors.length).toBe(1)
  })

  test("Repeat prescription with no dispenseRequest.expectedSupplyDuration adds an error", () => {
    delete firstMedicationRequest.dispenseRequest.expectedSupplyDuration
    const returnedErrors = validator.verifyRepeatDispensingPrescription(bundle, medicationRequests)
    expect(returnedErrors.length).toBe(1)
  })

  test("Repeat prescription with no extension does not add an error", () => {
    const repeatInformationExtension = getExtensionForUrl(
      firstMedicationRequest.extension,
      "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
      "MedicationRequest.extension"
    )
    firstMedicationRequest.extension.remove(repeatInformationExtension as fhir.UkCoreRepeatInformationExtension)
    const returnedErrors = validator.verifyRepeatDispensingPrescription(bundle, medicationRequests)
    expect(returnedErrors.length).toBe(0)
  })

  test("Repeat prescription with no authorisationExpiryDate does not add an error", () => {
    const repeatInformationExtension = getExtensionForUrl(
      firstMedicationRequest.extension,
      "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
      "MedicationRequest.extension"
    )
    repeatInformationExtension.extension = []
    const returnedErrors = validator.verifyRepeatDispensingPrescription(bundle, medicationRequests)
    expect(returnedErrors.length).toBe(0)
  })
})

describe("verifyCancellationBundle", () => {
  let bundle: fhir.Bundle

  beforeEach(() => {
    const cancelExample = TestResources.specification.map((s) => s.fhirMessageCancel).filter(isTruthy)[0]
    bundle = clone(cancelExample)
  })

  test("accepts a valid cancel request", () => {
    const returnedErrors = validator.verifyCancellationBundle(bundle)
    expect(returnedErrors.length).toBe(0)
  })

  test("returns an error when passed more than 1 MedicationRequest", () => {
    const medicationRequestEntry = bundle.entry.filter(
      (entry) => entry.resource.resourceType === "MedicationRequest"
    )[0]
    bundle.entry.push(medicationRequestEntry)
    const returnedErrors = validator.verifyCancellationBundle(bundle)
    expect(returnedErrors.length).toBe(1)
    expect(returnedErrors[0]).toEqual(errors.medicationRequestNumberIssue)
  })

  test("returns an error when status is not cancelled", () => {
    const medicationRequest = getMedicationRequests(bundle)[0]
    medicationRequest.status = fhir.MedicationRequestStatus.ACTIVE
    const returnedErrors = validator.verifyCancellationBundle(bundle)
    expect(returnedErrors.length).toBe(1)
    expect(returnedErrors[0].expression).toContainEqual("Bundle.entry.resource.ofType(MedicationRequest).status")
  })

  test("returns an error when MedicationRequest doesn't have a statusReason", () => {
    const medicationRequest = getMedicationRequests(bundle)[0]
    delete medicationRequest.statusReason
    const returnedErrors = validator.verifyCancellationBundle(bundle)
    expect(returnedErrors.length).toBe(1)
    expect(returnedErrors[0].expression).toContainEqual("Bundle.entry.resource.ofType(MedicationRequest).statusReason")
  })
})

describe("verifyDispenseNotificationBundle", () => {
  let bundle: fhir.Bundle

  beforeEach(() => {
    const dispenseExample = TestResources.specification.map((s) => s.fhirMessageDispense).filter(isTruthy)[0]
    bundle = clone(dispenseExample)
  })

  test("accepts a valid dispense request", () => {
    const returnedErrors = validator.verifyDispenseBundle(bundle)
    expect(returnedErrors.length).toBe(0)
  })

  test("returns an error when MedicationDispenses have different whenHandedOver timestamps", () => {
    const medicationDispenseEntry = bundle.entry.filter(
      (entry) => entry.resource.resourceType === "MedicationDispense"
    )[0]

    const medicationDispense1 = medicationDispenseEntry.resource as fhir.MedicationDispense
    medicationDispense1.whenHandedOver = "2009-09-21T09:24:20+00:00"

    const medicationDispenseEntry2 = clone(medicationDispenseEntry)
    const medicationDispense2 = medicationDispenseEntry.resource as fhir.MedicationDispense
    medicationDispense2.whenHandedOver = "1600-09-21T09:24:20+00:00"
    bundle.entry.push(medicationDispenseEntry2)

    const returnedErrors = validator.verifyDispenseBundle(bundle)
    expect(returnedErrors.length).toBe(1)
    expect(returnedErrors[0].expression).toContainEqual(
      "Bundle.entry.resource.ofType(MedicationDispense).whenHandedOver"
    )
  })

  test("returns an error when MedicationDispenses have different performer values per type", () => {
    const medicationDispenseEntry = clone(
      bundle.entry.filter((entry) => entry.resource.resourceType === "MedicationDispense")[0]
    )

    const medicationDispense = medicationDispenseEntry.resource as fhir.MedicationDispense
    medicationDispense.performer = [
      {
        actor: {
          reference: "#different-performer"
        }
      }
    ]

    bundle.entry.push(medicationDispenseEntry)

    const returnedErrors = validator.verifyDispenseBundle(bundle)
    expect(returnedErrors.length).toBe(1)
    expect(returnedErrors[0].expression).toContainEqual("Bundle.entry.resource.ofType(MedicationDispense).performer")
  })

  test("returns an error when MedicationDispenses have different nhs-numbers", () => {
    const medicationDispenseEntry = bundle.entry.filter(
      (entry) => entry.resource.resourceType === "MedicationDispense"
    )[0]

    const medicationDispense1 = medicationDispenseEntry.resource as fhir.MedicationDispense
    medicationDispense1.subject.identifier.value = "123456789"

    const medicationDispenseEntry2 = clone(medicationDispenseEntry)
    const medicationDispense2 = medicationDispenseEntry.resource as fhir.MedicationDispense
    medicationDispense2.subject.identifier.value = "987654321"
    bundle.entry.push(medicationDispenseEntry2)

    const returnedErrors = validator.verifyDispenseBundle(bundle)
    expect(returnedErrors.length).toBe(1)
    expect(returnedErrors[0].expression).toContainEqual(
      "Bundle.entry.resource.ofType(MedicationDispense).subject.identifier.value"
    )
  })

  test("returns an error when a MedicationDispense has both codeableConcept and reference", () => {
    const medicationDispenseEntry = bundle.entry.filter(
      (entry) => entry.resource.resourceType === "MedicationDispense"
    )[0]

    const medicationDispense = medicationDispenseEntry.resource as fhir.MedicationDispense
    const testCodeableConcept: fhir.CodeableConcept = {
      coding: []
    }
    const testReference: fhir.Reference<fhir.Medication> = {
      reference: "urn:uuid:test"
    }
    medicationDispense.medicationCodeableConcept = testCodeableConcept
    medicationDispense.medicationReference = testReference
    const returnedErrors = validator.verifyDispenseBundle(bundle)
    expect(returnedErrors.length).toBe(1)
  })

  test("returns an error when a MedicationDispense lacks the OrganisationRelationships extension", () => {
    const organizationEntry = bundle.entry.filter(
      (entry) => entry.resource.resourceType === "Organization")[0]

    delete organizationEntry.resource.extension

    const returnedErrors = validator.verifyDispenseBundle(bundle)
    expect(returnedErrors).toHaveLength(1)
    expect(returnedErrors[0].diagnostics).toBe(
      "The dispense notification is missing the reimbursement authority and it should be provided."
    )
  })

  test("returns an error when a MedicationDispense lacks an extension for the reimbursement authority", () => {
    const organizationEntry = bundle.entry.filter(
      (entry) => entry.resource.resourceType === "Organization")[0]

    delete organizationEntry.resource.extension[0].extension

    const returnedErrors = validator.verifyDispenseBundle(bundle)
    expect(returnedErrors).toHaveLength(1)
    expect(returnedErrors[0].diagnostics).toBe(
      "The dispense notification is missing the ODS code for reimbursement authority and it should be provided."
    )
  })
})
