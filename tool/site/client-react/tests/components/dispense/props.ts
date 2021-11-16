import {StaticLineItemInfo, StaticPrescriptionInfo} from "../../../src/components/dispense/dispenseForm"
import {LineItemStatus, PrescriptionStatus} from "../../../src/fhir/reference-data/valueSets"

export const staticLineItemInfoArray: Array<StaticLineItemInfo> = [
  {
    id: "599f341b-f94a-4157-92a6-7883feb6b499",
    name: "Salbutamol 100micrograms/dose inhaler CFC free",
    quantity: "200 dose",
    priorStatusCode: LineItemStatus.WITH_DISPENSER
  },
  {
    id: "85ad7441-845b-4ec4-b836-f503ee33b805",
    name: "Paracetamol 500mg soluble tablets",
    quantity: "100 tablet",
    priorStatusCode: LineItemStatus.NOT_DISPENSED,
    priorNonDispensingReasonCode: "0011"
  }]

export const staticPrescriptionInfo: StaticPrescriptionInfo = {
  priorStatusCode: PrescriptionStatus.WITH_DISPENSER
}
