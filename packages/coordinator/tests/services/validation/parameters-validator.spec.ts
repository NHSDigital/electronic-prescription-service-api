import {fhir, validationErrors as errors} from "@models"
import {ownerParameter, groupIdentifierParameter, agentParameter} from "../../resources/test-data/parameters"
import {verifyParameters} from "../../../src/services/validation/parameters-validator"
import {
  DISPENSING_APP_SCOPE,
  DISPENSING_USER_SCOPE,
  PRESCRIBING_APP_SCOPE,
  PRESCRIBING_USER_SCOPE
} from "../../../src/services/validation/scope-validator"

jest.spyOn(global.console, "warn").mockImplementation(() => null)

describe("verifyParameters returns errors", () => {
  const attendedAgentParameter: fhir.ResourceParameter<fhir.PractitionerRole> = {
    name: "agent",
    resource: {
      resourceType: "PractitionerRole",
      telecom: [
        {
          "system": "phone",
          "value": "02380798431",
          "use": "work"
        }
      ]
    }
  }

  const unattendedAgentParameter: fhir.ResourceParameter<fhir.PractitionerRole> = {
    name: "agent",
    resource: {
      ...attendedAgentParameter.resource,
      practitioner: {
        "identifier": {
          "system": "https://fhir.nhs.uk/Id/sds-user-id",
          "value": "3415870201"
        },
        "display": "Jackie Clark"
      }
    }
  }

  const validAttendedNominatedParameters: fhir.Parameters = {
    resourceType: "Parameters",
    parameter: [
      ownerParameter,
      attendedAgentParameter
    ]
  }
  const validUnattendedNominatedParameters: fhir.Parameters = {
    resourceType: "Parameters",
    parameter: [
      ownerParameter,
      unattendedAgentParameter
    ]
  }
  const validParametersWithUserAndRoleIDs: fhir.Parameters = {
    resourceType: "Parameters",
    parameter: [
      ownerParameter,
      agentParameter
    ]
  }
  const validSinglePrescriptionParameters: fhir.Parameters = {
    resourceType: "Parameters",
    parameter: [
      ownerParameter,
      groupIdentifierParameter,
      attendedAgentParameter
    ]
  }
  const missingOwnerParameters: fhir.Parameters = {
    resourceType: "Parameters",
    parameter: [
      groupIdentifierParameter,
      attendedAgentParameter
    ]
  }
  const missingAgentParameters: fhir.Parameters = {
    resourceType: "Parameters",
    parameter: [
      ownerParameter,
      groupIdentifierParameter
    ]
  }
  const missingGroupIdentifierParameters: fhir.Parameters = {
    resourceType: "Parameters",
    parameter: [
      ownerParameter
    ]
  }

  afterEach(() => {
    process.env.DISPENSE_ENABLED = "true"
  })

  test('rejects when resourceType not "Parameters"', () => {
    const invalidParameters = {...validSinglePrescriptionParameters, resourceType: "bluh"}
    const returnedErrors = verifyParameters(
      invalidParameters as fhir.Parameters,
      DISPENSING_APP_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(returnedErrors).toEqual([errors.createResourceTypeIssue("Parameters")])
  })

  test("verifyParameters rejects a message when dispensing is disabled", () => {
    process.env.DISPENSE_ENABLED = "false"
    const result = verifyParameters(
      validSinglePrescriptionParameters,
      DISPENSING_APP_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(result).toEqual([errors.createDisabledFeatureIssue("Dispensing")])
  })

  test("rejects single prescription release when only prescribing user scope present", () => {
    const result = verifyParameters(
      validSinglePrescriptionParameters,
      PRESCRIBING_USER_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(result).toEqual([errors.createMissingScopeIssue("Dispensing")])
  })

  test("rejects single prescription release when only prescribing app scope present", () => {
    const result = verifyParameters(
      validSinglePrescriptionParameters,
      PRESCRIBING_APP_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(result).toEqual([errors.createMissingScopeIssue("Dispensing")])
  })

  test("accepts single prescription release when only dispensing user scope present", () => {
    const result = verifyParameters(
      validSinglePrescriptionParameters,
      DISPENSING_USER_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(result).toEqual([])
  })

  test("rejects single prescription release when only dispensing app scope present", () => {
    const result = verifyParameters(
      validSinglePrescriptionParameters,
      DISPENSING_APP_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(result).toEqual([errors.createUserRestrictedOnlyScopeIssue("Dispensing")])
  })

  test("rejects nominated release when only prescribing user scope present", () => {
    const result = verifyParameters(
      validAttendedNominatedParameters,
      PRESCRIBING_USER_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(result).toEqual([errors.createMissingScopeIssue("Dispensing")])
  })

  test("rejects nominated release when only prescribing app scope present", () => {
    const result = verifyParameters(
      validAttendedNominatedParameters,
      PRESCRIBING_APP_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(result).toEqual([errors.createMissingScopeIssue("Dispensing")])
  })

  test("accepts nominated release when only dispensing user scope present", () => {
    const result = verifyParameters(
      validAttendedNominatedParameters,
      DISPENSING_USER_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(result).toEqual([])
  })

  test("accepts nominated release when only dispensing app scope present", () => {
    const result = verifyParameters(
      validAttendedNominatedParameters,
      DISPENSING_APP_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(result).toEqual([])
  })

  test("rejects when the owner parameter is missing", () => {
    expect(() => {
      const result = verifyParameters(
        missingOwnerParameters,
        DISPENSING_USER_SCOPE,
        "test_sds_user_id",
        "test_sds_role_id"
      )
      expect(result).toEqual([errors.missingRequiredParameter("owner")])
    })
  })

  test("rejects when group identifier is present and agent parameter is missing", () => {
    expect(() => {
      const result = verifyParameters(
        missingAgentParameters,
        DISPENSING_USER_SCOPE,
        "test_sds_user_id",
        "test_sds_role_id"
      )
      expect(result).toEqual([errors.missingRequiredParameter("agent")])
    })
  })

  test("accepts request if no group identifier and agent parameter is missing", () => {
    expect(() => {
      verifyParameters(missingGroupIdentifierParameters, DISPENSING_USER_SCOPE, "test_sds_user_id", "test_sds_role_id")
    }).not.toThrow()
  })

  test("accepts valid unattended agent param", () => {
    const result = verifyParameters(
      validUnattendedNominatedParameters,
      DISPENSING_USER_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(result).toEqual([])
  })

  test("console warn when inconsistent accessToken and body SDS user unique ID", () => {
    verifyParameters(validParametersWithUserAndRoleIDs, DISPENSING_APP_SCOPE, "test_sds_user_id", "555086415105")
    expect(console.warn).toHaveBeenCalled()
  })

  test("console warn when inconsistent accessToken and body SDS role profile ID", () => {
    verifyParameters(validParametersWithUserAndRoleIDs, DISPENSING_APP_SCOPE, "3415870201", "test_sds_role_id")
    expect(console.warn).toHaveBeenCalled()
  })
})
