/*
* Fhir Path Builder, used to extract values from FHIR.
* see http://hl7.org/fhirpath/ for the specification
* and https://github.com/HL7/fhirpath.js#readme
* for the latest implementation
*/

import { AbstractPathBuilder } from "./AbstractBuilder"
import { MedicationRequestPathBuilder } from "./MedicationRequest"
import {MessageHeaderPathBuilder} from "./MessageHeader"
import { PatientPathBuilder } from "./Patient"


class BundlePathBuilder extends AbstractPathBuilder {
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

class ClaimPathBuilder extends AbstractPathBuilder {
  constructor(path: string) {
    super(path)
  }
}

class ParametersPathBuilder extends AbstractPathBuilder {
  constructor(path: string) {
    super(path)
  }
}

class TaskPathBuilder extends AbstractPathBuilder {
  constructor(path: string) {
    super(path)
  }
}

export class FhirPathBuilder {
  bundle(): BundlePathBuilder {
    return new BundlePathBuilder("Bundle.entry.resource")
  }

  claim(): ClaimPathBuilder {
    return new ClaimPathBuilder("Claim")
  }

  parameters(): ParametersPathBuilder {
    return new ParametersPathBuilder("Parameters.parameter")
  }

  task(): TaskPathBuilder {
    return new TaskPathBuilder("Task")
  }
}
