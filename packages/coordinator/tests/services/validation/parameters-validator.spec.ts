import {fhir, validationErrors as errors} from "@models"
import {ownerParameter, groupIdentifierParameter, agentParameter} from "../../resources/test-data/parameters"
import {
  verifyAttendedParameters,
  verifyUnattendedParameters
} from "../../../src/services/validation/parameters-validator"
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

  const statusParameter: fhir.Parameter = {
    name: "status"
  }

  const validAttendedNominatedParameters: fhir.Parameters = {
    resourceType: "Parameters",
    parameter: [
      ownerParameter,
      statusParameter,
      groupIdentifierParameter,
      attendedAgentParameter
    ]
  }
  const validUnattendedNominatedParameters: fhir.Parameters = {
    resourceType: "Parameters",
    parameter: [
      ownerParameter,
      statusParameter,
      groupIdentifierParameter,
      unattendedAgentParameter
    ]
  }
  const validApplicationRestrictedUnattendedParameters: fhir.Parameters = {
    resourceType: "Parameters",
    parameter: [
      ownerParameter,
      statusParameter,
      groupIdentifierParameter
    ]
  }
  const validParametersWithUserAndRoleIDs: fhir.Parameters = {
    resourceType: "Parameters",
    parameter: [
      ownerParameter,
      statusParameter,
      groupIdentifierParameter,
      agentParameter
    ]
  }
  const validSinglePrescriptionParameters: fhir.Parameters = {
    resourceType: "Parameters",
    parameter: [
      ownerParameter,
      statusParameter,
      groupIdentifierParameter,
      attendedAgentParameter
    ]
  }
  const missingOwnerParameters: fhir.Parameters = {
    resourceType: "Parameters",
    parameter: [
      statusParameter,
      groupIdentifierParameter,
      attendedAgentParameter
    ]
  }
  const missingStatusParameters: fhir.Parameters = {
    resourceType: "Parameters",
    parameter: [
      ownerParameter,
      groupIdentifierParameter,
      attendedAgentParameter
    ]
  }
  const missingGroupIdentifierParameters: fhir.Parameters = {
    resourceType: "Parameters",
    parameter: [
      ownerParameter,
      statusParameter,
      attendedAgentParameter
    ]
  }
  const missingAgentParameters: fhir.Parameters = {
    resourceType: "Parameters",
    parameter: [
      ownerParameter,
      statusParameter,
      groupIdentifierParameter
    ]
  }

  afterEach(() => {
    process.env.DISPENSE_ENABLED = "true"
  })

  test('rejects when resourceType not "Parameters"', () => {
    const invalidParameters = {...validSinglePrescriptionParameters, resourceType: "bluh"}
    const returnedErrors = verifyAttendedParameters(
      invalidParameters as fhir.Parameters,
      DISPENSING_APP_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(returnedErrors).toEqual([errors.createResourceTypeIssue("Parameters")])
  })

  test("verifyParameters rejects a message when dispensing is disabled", () => {
    process.env.DISPENSE_ENABLED = "false"
    const result = verifyAttendedParameters(
      validSinglePrescriptionParameters,
      DISPENSING_APP_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(result).toEqual([errors.createDisabledFeatureIssue("Dispensing")])
  })

  test("rejects single prescription release when only prescribing user scope present", () => {
    const result = verifyAttendedParameters(
      validSinglePrescriptionParameters,
      PRESCRIBING_USER_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(result).toEqual([errors.createMissingScopeIssue("Dispensing")])
  })

  test("rejects single prescription release when only prescribing app scope present", () => {
    const result = verifyAttendedParameters(
      validSinglePrescriptionParameters,
      PRESCRIBING_APP_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(result).toEqual([errors.createMissingScopeIssue("Dispensing")])
  })

  test("accepts single prescription release when only dispensing user scope present", () => {
    const result = verifyAttendedParameters(
      validSinglePrescriptionParameters,
      DISPENSING_USER_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(result).toEqual([])
  })

  test("rejects single prescription release when only dispensing app scope present", () => {
    const result = verifyAttendedParameters(
      validSinglePrescriptionParameters,
      DISPENSING_APP_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(result).toEqual([errors.createUserRestrictedOnlyScopeIssue("Dispensing")])
  })

  test("rejects nominated release when only prescribing user scope present", () => {
    const result = verifyAttendedParameters(
      validAttendedNominatedParameters,
      PRESCRIBING_USER_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(result).toEqual([errors.createMissingScopeIssue("Dispensing")])
  })

  test("rejects nominated release when only prescribing app scope present", () => {
    const result = verifyAttendedParameters(
      validAttendedNominatedParameters,
      PRESCRIBING_APP_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(result).toEqual([errors.createMissingScopeIssue("Dispensing")])
  })

  test("accepts nominated release when only dispensing user scope present", () => {
    const result = verifyAttendedParameters(
      validAttendedNominatedParameters,
      DISPENSING_USER_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(result).toEqual([])
  })

  test("rejects nominated release when only dispensing app scope present by default", () => {
    const result = verifyAttendedParameters(
      validAttendedNominatedParameters,
      DISPENSING_APP_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(result).toEqual([errors.createUserRestrictedOnlyScopeIssue("Dispensing")])
  })

  test("rejects unattended application-restricted release when performer role is included", () => {
    const result = verifyUnattendedParameters(
      validAttendedNominatedParameters,
      DISPENSING_APP_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(result).toEqual([errors.unexpectedField('Parameters.parameter("agent")')])
  })

  test("accepts unattended application-restricted release when performer role is omitted", () => {
    const result = verifyUnattendedParameters(
      validApplicationRestrictedUnattendedParameters,
      DISPENSING_APP_SCOPE,
      "test_sds_user_id",
      ""
    )
    expect(result).toEqual([])
  })

  test("rejects when the owner parameter is missing", () => {
    expect(() => {
      const result = verifyAttendedParameters(
        missingOwnerParameters,
        DISPENSING_USER_SCOPE,
        "test_sds_user_id",
        "test_sds_role_id"
      )
      expect(result).toEqual([errors.missingRequiredParameter("owner")])
    })
  })

  test("rejects when the status parameter is missing", () => {
    const result = verifyAttendedParameters(
      missingStatusParameters,
      DISPENSING_USER_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(result).toEqual([errors.missingRequiredParameter("status")])
  })

  test("rejects when the group-identifier parameter is missing", () => {
    const result = verifyAttendedParameters(
      missingGroupIdentifierParameters,
      DISPENSING_USER_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(result).toEqual([errors.missingRequiredParameter("group-identifier")])
  })

  test("rejects when the agent parameter is missing", () => {
    const result = verifyAttendedParameters(
      missingAgentParameters,
      DISPENSING_USER_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(result).toEqual([errors.missingRequiredParameter("agent")])
  })

  test("rejects unattended user-restricted release as forbidden", () => {
    const result = verifyUnattendedParameters(
      validApplicationRestrictedUnattendedParameters,
      DISPENSING_USER_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(result).toEqual([errors.createMissingScopeIssue("Dispensing")])
  })

  test("accepts valid unattended agent param", () => {
    const result = verifyAttendedParameters(
      validUnattendedNominatedParameters,
      DISPENSING_USER_SCOPE,
      "test_sds_user_id",
      "test_sds_role_id"
    )
    expect(result).toEqual([])
  })

  test("console warn when inconsistent accessToken and body SDS user unique ID", () => {
    verifyAttendedParameters(
      validParametersWithUserAndRoleIDs, DISPENSING_USER_SCOPE, "test_sds_user_id", "555086415105")
    expect(console.warn).toHaveBeenCalled()
  })

  test("console warn when inconsistent accessToken and body SDS role profile ID for user-restricted access", () => {
    jest.clearAllMocks()
    verifyAttendedParameters(validParametersWithUserAndRoleIDs, DISPENSING_USER_SCOPE, "3415870201", "test_sds_role_id")
    expect(console.warn).toHaveBeenCalled()
  })

  test("does not warn about SDS role profile ID for application-restricted access", () => {
    jest.clearAllMocks()
    verifyUnattendedParameters(
      validApplicationRestrictedUnattendedParameters,
      DISPENSING_APP_SCOPE,
      "3415870201",
      ""
    )
    expect(console.warn).not.toHaveBeenCalled()
  })
})
