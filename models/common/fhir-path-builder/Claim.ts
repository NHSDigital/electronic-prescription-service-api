import { AbstractPathBuilder } from "./AbstractBuilder"
import { PatientPathBuilder } from "./Patient"

class PrescriptionPathBuilder extends AbstractPathBuilder {
   constructor(path: string) {
      super(path)
   }

   shortFormId(): string {
      const extension = `${this.path}.extension.extension`
      const valuePath = "valueIdentifier.where(system = 'https://fhir.nhs.uk/Id/prescription-order-number').value"
      return `${extension}.${valuePath}`
   }
}

class ClaimPathBuilder extends AbstractPathBuilder {
   constructor(path: string) {
      super(path)
   }

   patient(): PatientPathBuilder {
      return new PatientPathBuilder(`${this.path}.patient`)
   }

   prescription(): PrescriptionPathBuilder {
      return new PrescriptionPathBuilder(`${this.path}.prescription`)
   }
}

export { ClaimPathBuilder, PrescriptionPathBuilder }