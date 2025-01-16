import {AbstractPathBuilder} from "./AbstractBuilder"

export class TaskPathBuilder extends AbstractPathBuilder {
  constructor(path: string) {
    super(path)
  }

  identifier(): string {
    return `${this.path}.identifier.value`
  }

  nhsNumber(): string {
    return `${this.path}.for.identifier.where(system = 'https://fhir.nhs.uk/Id/nhs-number').value`
  }

  prescriptionShortFormId(): string {
    return `${this.path}.groupIdentifier.where(system = 'https://fhir.nhs.uk/Id/prescription-order-number').value`
  }

  requester(): string {
    // TODO: Should we use a reference to the element within 'contained'?
    // const requesterReference = `${this.path}.requester.reference.substring(1)` // Get the value after the '#'
    // eslint-disable-next-line max-len
    return `${this.path}.contained.where(resourceType = 'Organization').identifier.where(system = 'https://fhir.nhs.uk/Id/ods-organization-code').value`
  }
}
