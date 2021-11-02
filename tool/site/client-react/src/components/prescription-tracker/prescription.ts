import {Task} from "fhir/r4"
import {createPrescriptionDetailProps, PrescriptionDetailProps} from "./prescriptionDetails"
import {createPrescriptionItemProps, PrescriptionItemProps} from "./prescriptionItems"

export interface PrescriptionProps {
  prescription: PrescriptionDetailProps
  prescriptionItems: PrescriptionItemProps[]
}

export function createPrescriptionProps(task: Task): PrescriptionProps {
  return {
    prescription: createPrescriptionDetailProps(task),
    prescriptionItems: createPrescriptionItemProps(task)
  }
}
