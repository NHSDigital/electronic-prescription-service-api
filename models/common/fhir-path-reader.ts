import {evaluate} from "fhirpath"
import {Resource} from "../fhir"

/*
* Fhir Path Reader, used to extract values from FHIR.
* see http://hl7.org/fhirpath/ for the specification
* and https://github.com/HL7/fhirpath.js#readme
* for the latest implementation
*/

export class FhirPathReader {
    private fhir: Resource
    constructor(fhir: Resource) {
      this.fhir = fhir
    }

    read(path: string): string {
      const results = this.readAll(path)
      if (results.length > 1) {
        // eslint-disable-next-line max-len
        throw new Error(`Fhir Path Reader unexpectedly got more than 1 result for path: '${path}'. Did you mean to call 'readAll'?`)
      }
      if (results.length < 1) {
        return ""
      }
      return results[0]
    }

    readAll(path: string): Array<string> {
      return evaluate(this.fhir, path)
    }
}
