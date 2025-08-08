import {fhir, processingErrors as errors} from "@models"
import * as jrc from "../../../../src/services/translation/request/job-role-code"

describe("getJobRoleCodeOrName", () => {
  test("Only JobRoleName", () => {
    const practitionerRole = new fhir.PractitionerRole()
    const coding = {
      system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
      code: "R8000",
      display: "Clinical Practitioner Access Role"
    }
    practitionerRole.code = [{coding: [coding]}]
    const jobRoleCode = jrc.getJobRoleCodeOrName(practitionerRole)
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
    const jobRoleCode = jrc.getJobRoleCodeOrName(practitionerRole)
    expect(jobRoleCode).toEqual(coding)
  })
  test("Neither JobRoleCode nor JobRoleName", () => {
    const practitionerRole = new fhir.PractitionerRole()
    practitionerRole.code = [{coding: []}]
    const jobRoleCode = () => jrc.getJobRoleCodeOrName(practitionerRole)
    expect(jobRoleCode).toThrow(
      new errors.TooFewValuesError(
        // eslint-disable-next-line max-len
        "Too few values submitted. Expected at least 1 element where system in [https://fhir.nhs.uk/CodeSystem/NHSDigital-SDS-JobRoleCode, https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName]."
      )
    )
  })
  test("Both JobRoleCode and JobRoleName", () => {
    const practitionerRole = new fhir.PractitionerRole()
    const codingCode = {
      system: "https://fhir.nhs.uk/CodeSystem/NHSDigital-SDS-JobRoleCode",
      code: "S8000:G8000:R8000",
      display: "Clinical Practitioner Access Role"
    }
    const codingName = {
      system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
      code: "R8000",
      display: "Clinical Practitioner Access Role"
    }
    practitionerRole.code = [{coding: [codingCode, codingName]}]
    const jobRoleCode = jrc.getJobRoleCodeOrName(practitionerRole)
    expect(jobRoleCode).toEqual(codingCode)
  })
})
