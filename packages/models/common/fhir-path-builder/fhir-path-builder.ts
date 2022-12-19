/*
* Fhir Path Builder, used to extract values from FHIR.
* see http://hl7.org/fhirpath/ for the specification
* and https://github.com/HL7/fhirpath.js#readme
* for the latest implementation
*/

import {BundlePathBuilder} from "./Bundle"
import {ClaimPathBuilder} from "./Claim"
import {ParametersPathBuilder} from "./Parameters"
import {TaskPathBuilder} from "./Task"

export class FhirPathBuilder {
  bundle(): BundlePathBuilder {
    return new BundlePathBuilder("Bundle")
  }

  claim(): ClaimPathBuilder {
    return new ClaimPathBuilder("Claim")
  }

  parameters(): ParametersPathBuilder {
    return new ParametersPathBuilder("Parameters")
  }

  task(): TaskPathBuilder {
    return new TaskPathBuilder("Task")
  }
}
