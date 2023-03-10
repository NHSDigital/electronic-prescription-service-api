import {fhir} from "@models"
import {getListWithSeparators} from "./utils"

/**
 * TODO - Implemented as per the guide but chaining multiple instructions in this way could change their meaning
 */
export default function stringifyAdditionalInstruction(dosage: fhir.Dosage): Array<string> {
  if (!dosage.additionalInstruction?.length) {
    return []
  }

  const additionalInstructionDisplays = dosage.additionalInstruction
    .flatMap(codeableConcept => codeableConcept?.coding)
    .map(coding => coding?.display)
  return getListWithSeparators(additionalInstructionDisplays)
}
