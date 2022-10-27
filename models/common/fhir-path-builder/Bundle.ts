import {AbstractPathBuilder} from "./AbstractBuilder"
import {MedicationRequestPathBuilder} from "./MedicationRequest"
import {MessageHeaderPathBuilder} from "./MessageHeader"
import {PatientPathBuilder} from "./Patient"

export class BundlePathBuilder extends AbstractPathBuilder {
  constructor(path: string) {
    super(path)
  }

  messageHeader(): MessageHeaderPathBuilder {
    return new MessageHeaderPathBuilder(`${this.path}.ofType(MessageHeader)`)
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
