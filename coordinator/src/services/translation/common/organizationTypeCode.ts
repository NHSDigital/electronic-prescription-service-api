export enum OrganisationTypeCode {
    GENERAL_MEDICAL_PRACTICE = "001",
    GENERAL_DENTAL_PRACTICE = "002",
    COMMUNITY_PHARMACY = "003",
    COMMUNITY_OPTICIANS = "004",
    PRIMARY_CARE_TRUST = "005",
    STRATEGIC_HEALTH_AUTHORITY = "006",
    SPECIAL_HEALTH_AUTHORITY = "007",
    ACUTE_TRUST = "008",
    CARE_TRUST = "009",
    COMMUNITY_TRUST = "010",
    DIAGNOSTIC_AND_INVESTIGATION_CENTRE = "011",
    WALK_IN_CENTRE = "012",
    NHS_DIRECT = "013",
    LOCAL_AUTHORITY_SOCIAL_SERVICES_DEPARTMENT = "014",
    NURSING_HOME = "015",
    RESIDENTIAL_HOME = "016",
    HOSPICE = "017",
    AMBULANCE_TRUST = "018",
    PRIVATE_HOSPITAL = "019",
    GMP_DEPUTISING_SERVICE = "020",
    NURSING_AGENCY = "021",
    NOT_SPECIFIED = "999"
}

export const SECONDARY_CARE_ORGANISATION_TYPE_CODES = [
  OrganisationTypeCode.ACUTE_TRUST,
  OrganisationTypeCode.CARE_TRUST,
  OrganisationTypeCode.COMMUNITY_TRUST,
  OrganisationTypeCode.AMBULANCE_TRUST
]

export enum CareSetting {
    PRIMARY_CARE = "primary-care",
    SECONDARY_CARE = "secondary-care"
}

export function getCareSetting(organisationTypeCode: string): CareSetting {
  if (organisationTypeIsSecondaryCare(organisationTypeCode)) {
    return CareSetting.SECONDARY_CARE
  }
  return CareSetting.PRIMARY_CARE
}

function organisationTypeIsSecondaryCare(organisationTypeCode: string) {
  return Object.values(SECONDARY_CARE_ORGANISATION_TYPE_CODES)
    .includes(organisationTypeCode as OrganisationTypeCode)
}
