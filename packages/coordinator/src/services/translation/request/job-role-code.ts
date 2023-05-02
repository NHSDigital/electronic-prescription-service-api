import {fhir, processingErrors as errors} from "@models"
import {getCodeableConceptCodingForSystemOrNull} from "../common"

export function getJobRoleCodeOrName(
  practitionerRole: fhir.PractitionerRole
): fhir.Coding {
  const jobRoleSystems = [
    "https://fhir.nhs.uk/CodeSystem/NHSDigital-SDS-JobRoleCode",
    "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName"
  ]

  for (const system of jobRoleSystems) {
    const coding = getCodeableConceptCodingForSystemOrNull(
      practitionerRole.code,
      system,
      "PractitionerRole.code"
    )
    if (coding) {
      return coding
    }
  }

  throw new errors.TooFewValuesError(
    `Too few values submitted. Expected at least 1 element where system in [${jobRoleSystems.join(", ")}].`
  )
}
