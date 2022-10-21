/*
* Fhir Path Builder, used to extract values from FHIR.
* see http://hl7.org/fhirpath/ for the specification
* and https://github.com/HL7/fhirpath.js#readme
* for the latest implementation
*/

export class FhirPathBuilder {
  bundle(): BundlePathBuilder {
    return new BundlePathBuilder("Bundle.entry.resource")
  }
}

class AbstractPathBuilder {
  protected path: string

  constructor(path: string) {
    this.path = path
  }
}

class BundlePathBuilder extends AbstractPathBuilder {
  constructor(path: string) {
    super(path)
  }

  patient(): PatientPathBuilder {
    return new PatientPathBuilder(`${this.path}.ofType(Patient).first()`)
  }

  medicationRequest(): MedicationRequestPathBuilder {
    return new MedicationRequestPathBuilder(`${this.path}.ofType(MedicationRequest).first()`)
  }

  medicationRequests(): MedicationRequestPathBuilder {
    return new MedicationRequestPathBuilder(`${this.path}.ofType(MedicationRequest)`)
  }
}

class MedicationRequestPathBuilder extends AbstractPathBuilder {
  constructor(path: string) {
    super(path)
  }

  prescriptionId(): string {
    // eslint-disable-next-line max-len
    return `${this.path}.groupIdentifier.extension.where(url = 'https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId').first().valueIdentifier.value`
  }

  prescriptionShortFormId(): string {
    return `${this.path}.groupIdentifier.value`
  }

  repeatsIssued(): string {
    // eslint-disable-next-line max-len
    return `${this.path}.extension.where(url = 'https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation').extension.where(url = 'numberOfPrescriptionsIssued').valueUnsignedInt`
  }
}

class PatientPathBuilder extends AbstractPathBuilder {
  constructor(path: string) {
    super(path)
  }

  nhsNumber(): string {
    return `${this.path}.identifier.where(system = 'https://fhir.nhs.uk/Id/nhs-number').value`
  }

  generalPractitioner(): GeneralPractitionerPathBuilder {
    return new GeneralPractitionerPathBuilder(`${this.path}.generalPractitioner`)
  }
}

class GeneralPractitionerPathBuilder extends AbstractPathBuilder {
  constructor(path: string) {
    super(path)
  }

  odsOrganizationCode(): string {
    return `${this.path}.identifier.where(system = 'https://fhir.nhs.uk/Id/ods-organization-code').value`
  }
}
