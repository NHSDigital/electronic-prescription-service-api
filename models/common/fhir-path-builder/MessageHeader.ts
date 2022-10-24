import { AbstractPathBuilder } from "./AbstractBuilder"
import { MedicationRequestPathBuilder } from "./MedicationRequest"
import { PatientPathBuilder } from "./Patient"

export class MessageHeaderPathBuilder extends AbstractPathBuilder {
  constructor(path: string) {
    super(path)
  }

  sender(): SenderPathBuilder {
    return new SenderPathBuilder(`${this.path}.sender`)
  }

  destination(): MedicationRequestPathBuilder {
    return new MedicationRequestPathBuilder(`${this.path}.ofType(MedicationRequest).first()`)
  }

  medicationRequests(): MedicationRequestPathBuilder {
    return new MedicationRequestPathBuilder(`${this.path}.ofType(MedicationRequest)`)
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