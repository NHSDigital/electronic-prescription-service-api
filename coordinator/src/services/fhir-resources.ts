export abstract class Resource {
    id?: string
    resourceType: string
}

export class Bundle extends Resource {
    entry?: Array<BundleEntry>
}

class BundleEntry {
    fullUrl?: string
    resource?: Resource
}

export class Identifier {
    system?: string
    value?: string
}

export class MedicationRequest extends Resource {
    identifier?: Array<Identifier>
    category?: Array<CodeableConcept>
    medicationCodeableConcept: CodeableConcept
    subject: Reference
    encounter?: Reference
    authoredOn?: string
    requester?: Reference
    groupIdentifier?: Array<Identifier> //TODO this is a lie
    dosageInstruction?: Array<Dosage>
    dispenseRequest?: MedicationRequestDispenseRequest
}

export class CodeableConcept {
    coding: Array<Coding>
}

export class Coding {
    system?: string
    code?: string
    display?: string
    version?: number
}

export class Reference {
    reference: string
}

export class Dosage {
    text?: string
}

export class MedicationRequestDispenseRequest {
    quantity?: SimpleQuantity
}

export class SimpleQuantity {
    value?: string
    unit?: string
    system?: string
    code?: string
}

export class Patient extends Resource {
    identifier?: Array<Identifier>
    name?: Array<HumanName>
    telecom?: Array<ContactPoint>
    gender?: string
    birthDate?: string
    address?: Array<Address>
    generalPractitioner?: Reference
}

export class HumanName {
    use?: string
    family?: string
    given?: Array<string>
    prefix?: Array<string>
    suffix?: Array<string>
}

export class ContactPoint {
    system?: string
    value?: string
    use?: string
    rank?: number //TODO use this as a tie-breaker
}

export class Address {
    use?: string
    type?: string
    text?: string
    line?: Array<string>
    city?: string
    district?: string
    state?: string
    postalCode?: string
}

export class PractitionerRole extends Resource {
    practitioner?: Reference
    organization?: Reference
}

export class Practitioner extends Resource {
    identifier?: Array<Identifier>
    name?: Array<HumanName>
    telecom?: Array<ContactPoint>
    address?: Array<Address>
}

export class Organization extends Resource {
    identifier?: Array<Identifier>
    type?: Array<CodeableConcept>
    name?: string
    telecom?: Array<ContactPoint>
    address?: Array<Address>
    partOf?: Reference
}

export class OperationOutcomeIssue {
    severity: string
    code: string
    details: CodeableConcept

    constructor(severity: string, code: string, details: CodeableConcept) {
        this.severity = severity
        this.code = code
        this.details = details
    }
}

export class OperationOutcome {
    resourceType: "OperationOutcome"
    issue: Array<OperationOutcomeIssue>
}
