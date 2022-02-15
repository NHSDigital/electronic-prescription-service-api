import {StaticLineItemInfo, StaticPrescriptionInfo} from "../../../src/components/dispense/dispenseForm"
import {LineItemStatus, PrescriptionStatus} from "../../../src/fhir/reference-data/valueSets"

export const staticLineItemInfoArray: Array<StaticLineItemInfo> = [
  {
    id: "599f341b-f94a-4157-92a6-7883feb6b499",
    name: "Salbutamol 100micrograms/dose inhaler CFC free",
    prescribedQuantityUnit: "dose",
    prescribedQuantityValue: 200,
    dispensedQuantityValue: 200,
    priorStatusCode: LineItemStatus.WITH_DISPENSER,
    alternativeMedicationAvailable: false
  },
  {
    id: "85ad7441-845b-4ec4-b836-f503ee33b805",
    name: "Paracetamol 500mg soluble tablets",
    prescribedQuantityUnit: "tablet",
    prescribedQuantityValue: 100,
    priorStatusCode: LineItemStatus.NOT_DISPENSED,
    priorNonDispensingReasonCode: "0011",
    alternativeMedicationAvailable: false
  }
]

export const staticPrescriptionInfo: StaticPrescriptionInfo = {
  dispenseDate: new Date(2021, 12, 1, 14, 15),
  priorStatusCode: PrescriptionStatus.WITH_DISPENSER
}
