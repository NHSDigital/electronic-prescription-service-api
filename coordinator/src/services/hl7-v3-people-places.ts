import * as codes from "./hl7-v3-datatypes-codes"
import * as core from "./hl7-v3-datatypes-core"

/**
 * Identifies or provides detailed information about a person fulfilling a specific role when it is not known whether all of the role profile, player and scoper details are available from SDS.
 */
export class AgentPerson {
    _attributes: core.AttributeClassCode = {
        classCode: "AGNT"
    }
    id: codes.SdsRoleProfileIdentifier
    code: codes.SdsJobRoleCode
    telecom?: Array<core.Telecom>
    agentPerson: AgentPersonPerson
    representedOrganization: Organization
}

/**
 * The provider responsible for the patient care provision, e.g. a GP with whom the patient is registered.
 */
export class HealthCareProvider {
    _attributes: core.AttributeClassCode = {
        classCode: "PROV"
    }
    id: codes.SdsUniqueIdentifier
}

/**
 * Details of an organisation on SDS.
 */
export class Organization {
    _attributes: core.AttributeClassCode & core.AttributeDeterminerCode = {
        classCode: "ORG",
        determinerCode: "INSTANCE"
    }
    id: codes.SdsOrganizationIdentifier
    code: codes.OrganizationTypeCode
    name: string
    telecom?: core.Telecom
    addr?: core.Address
    healthCareProviderLicense?: HealthCareProviderLicense
}

/**
 * A link to a controlling organisation.
 */
export class HealthCareProviderLicense {
    _attributes: core.AttributeClassCode = {
        classCode: "PROV"
    }
    Organization: Organization

    constructor(organization: Organization) {
        this.Organization = organization
    }
}

/**
 * Provides information about a patient's demographics and healthcare provision in a way that conforms to the PDS patient structure.
 */
export class Patient {
    _attributes: core.AttributeClassCode = {
        classCode: "PAT"
    }
    id: codes.NhsNumber
    addr: Array<core.Address>
    telecom?: Array<core.Telecom>
    patientPerson: PatientPerson
}


/**
 * Act defining a relationship between a patient and his/her primary care provider.
 */
export class PatientCareProvision {
    _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
        classCode: "PCPR",
        moodCode: "EVN"
    }
    code: codes.PatientCareProvisionTypeCode
    responsibleParty: ResponsibleParty

    constructor(code: string) {
        this.code = new codes.PatientCareProvisionTypeCode(code)
    }
}

/**
 * A link to the professional who is directly responsible for the patient care provision.
 */
export class ResponsibleParty {
    _attributes: core.AttributeTypeCode = {
        typeCode: "RESP"
    }
    healthCareProvider: HealthCareProvider

    constructor(healthCareProvider: HealthCareProvider) {
        this.healthCareProvider = healthCareProvider
    }
}

/**
 * Details of the person who is the patient.
 */
export class PatientPerson {
    _attributes: core.AttributeClassCode & core.AttributeDeterminerCode = {
        classCode: "PSN",
        determinerCode: "INSTANCE"
    }
    name: Array<core.Name>
    administrativeGenderCode: codes.SexCode
    birthTime: core.Timestamp
    playedProviderPatient: ProviderPatient
}

/**
 * Details of a person on SDS.
 */
export class AgentPersonPerson {
    _attributes: core.AttributeClassCode & core.AttributeDeterminerCode = {
        classCode: "PSN",
        determinerCode: "INSTANCE"
    }
    id: codes.SdsUniqueIdentifier
    name?: core.Name
}

/**
 * A Role of a Person as a recipient of healthcare services from a healthcare provider.
 */
export class ProviderPatient {
    _attributes: core.AttributeClassCode = {
        classCode: "PAT"
    }
    subjectOf: SubjectOf
}

/**
 * A link to the Patient who is the subject of the patient care provision.
 */
export class SubjectOf {
    _attributes: core.AttributeTypeCode = {
        typeCode: "SBJ"
    }
    patientCareProvision: PatientCareProvision

    constructor(patientCareProvision: PatientCareProvision) {
        this.patientCareProvision = patientCareProvision
    }
}
