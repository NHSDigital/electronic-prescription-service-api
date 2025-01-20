import {AbstractPathBuilder} from "./AbstractBuilder"
import {MedicationRequestPathBuilder} from "./MedicationRequest"

export class MessageHeaderPathBuilder extends AbstractPathBuilder {
  constructor(path: string) {
    super(path)
  }

  sender(): SenderPathBuilder {
    return new SenderPathBuilder(`${this.path}.sender`)
  }

  destination(): MedicationRequestPathBuilder {
    return new MedicationRequestPathBuilder(`${this.path}.where(resourceType = 'MedicationRequest').first()`)
  }

  medicationRequests(): MedicationRequestPathBuilder {
    return new MedicationRequestPathBuilder(`${this.path}.where(resourceType = 'MedicationRequest')`)
  }
}

class SenderPathBuilder extends AbstractPathBuilder {
  constructor(path: string) {
    super(path)
  }

  identifier(): string {
    return `${this.path}.identifier.value`
  }
}
