import { AbstractPathBuilder } from "./AbstractBuilder"

class RequesterPathBuilder extends AbstractPathBuilder {
  constructor(path: string) {
    super(path)
  }
}

export class TaskPathBuilder extends AbstractPathBuilder {
  constructor(path: string) {
    super(path)
  }

  nhsNumber(): string {
    return `${this.path}.for.identifier.where(system = 'https://fhir.nhs.uk/Id/nhs-number').value`
  }

  prescriptionShortFormId(): string {
    return `${this.path}.groupIdentifier.where(system = 'https://fhir.nhs.uk/Id/prescription-order-number').value`
  }

  requester(): string {
    // TODO: Should we use a reference to the element within 'contained'?
    // const requesterReference = `${this.path}.requester.reference`
    return `${this.path}.contained.ofType(Organization).identifier.where(system = 'https://fhir.nhs.uk/Id/ods-organization-code').value`
  }
}