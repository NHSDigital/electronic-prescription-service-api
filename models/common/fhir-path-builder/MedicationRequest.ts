import {AbstractPathBuilder} from "./AbstractBuilder"

export class MedicationRequestPathBuilder extends AbstractPathBuilder {
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
