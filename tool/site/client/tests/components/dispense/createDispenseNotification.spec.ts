import {
  getMedicationDispenseResources,
  getMedicationRequestResources,
  getMessageHeaderResources,
  getPatientResources
} from "../../../src/fhir/bundleResourceFinder"
import {createDispenseNotification} from "../../../src/components/dispense/createDispenseNotification"
import {readMessage} from "../../messages/messages"
import {DispenseFormValues, LineItemFormValues} from "../../../src/components/dispense/dispenseForm"
import {
  COURSE_OF_THERAPY_TYPE_CODES,
  LineItemStatus,
  PrescriptionStatus
} from "../../../src/fhir/reference-data/valueSets"
import {createStaticLineItemInfoArray} from "../../../src/pages/dispensePage"
import {v4} from "uuid"

const prescriptionOrder = readMessage("prescriptionOrder.json")
const dispenseNotification = readMessage("dispenseNotification.json")
const messageHeader = getMessageHeaderResources(prescriptionOrder)[0]
const patient = getPatientResources(prescriptionOrder)[0]
const medicationRequests = getMedicationRequestResources(prescriptionOrder)
const medicationDispenses = getMedicationDispenseResources(dispenseNotification)

jest.mock("uuid")
beforeEach(() => {
  (v4 as jest.Mock).mockImplementation(() => "test-uuid")
})

const staticLineItemsArray =
  createStaticLineItemInfoArray(medicationRequests, medicationDispenses) as Array<LineItemFormValues>

const dispenseFormValues: DispenseFormValues = {
  lineItems: staticLineItemsArray,
  prescription: {
    dispenseDate: new Date("August 19, 1975 23:15:30 GMT+07:00"),
    priorStatusCode: PrescriptionStatus.TO_BE_DISPENSED,
    statusCode: PrescriptionStatus.TO_BE_DISPENSED
  }
}

test("Produces expected result when status fully dispensed", () => {
  staticLineItemsArray.map(lineItem => {
    lineItem.statusCode = LineItemStatus.DISPENSED
  })
  dispenseFormValues.prescription.priorStatusCode = PrescriptionStatus.TO_BE_DISPENSED
  dispenseFormValues.prescription.statusCode = PrescriptionStatus.DISPENSED
  const result = createDispenseNotification(messageHeader, patient, medicationRequests, dispenseFormValues)
  expect(result).toMatchSnapshot()
})

test("Produces expected result when status partially dispensed", () => {
  dispenseFormValues.lineItems[0].suppliedQuantityValue = "1"
  dispenseFormValues.lineItems[0].statusCode = LineItemStatus.PARTIALLY_DISPENSED
  dispenseFormValues.prescription.statusCode = PrescriptionStatus.PARTIALLY_DISPENSED

  const result = createDispenseNotification(messageHeader, patient, medicationRequests, dispenseFormValues)
  expect(result).toMatchSnapshot()
})

test("Produces expected result when status partial dispense is done on a partial dispense", () => {
  dispenseFormValues.lineItems[0].suppliedQuantityValue = "3"
  dispenseFormValues.lineItems[0].priorStatusCode = LineItemStatus.PARTIALLY_DISPENSED
  dispenseFormValues.lineItems[0].statusCode = LineItemStatus.PARTIALLY_DISPENSED
  dispenseFormValues.prescription.priorStatusCode = PrescriptionStatus.PARTIALLY_DISPENSED
  dispenseFormValues.prescription.statusCode = PrescriptionStatus.PARTIALLY_DISPENSED

  const result = createDispenseNotification(messageHeader, patient, medicationRequests, dispenseFormValues)
  expect(result).toMatchSnapshot()
})

test("Produces expected result when status full dispense is done on a partial dispense", () => {
  dispenseFormValues.lineItems[0].priorStatusCode = LineItemStatus.PARTIALLY_DISPENSED
  dispenseFormValues.lineItems[0].statusCode = LineItemStatus.DISPENSED
  dispenseFormValues.prescription.priorStatusCode = PrescriptionStatus.PARTIALLY_DISPENSED
  dispenseFormValues.prescription.statusCode = PrescriptionStatus.DISPENSED

  const result = createDispenseNotification(messageHeader, patient, medicationRequests, dispenseFormValues)
  expect(result).toMatchSnapshot()
})

test("Quantity is populated correctly for full dispense", () => {
  dispenseFormValues.lineItems[0].priorStatusCode = LineItemStatus.TO_BE_DISPENSED
  dispenseFormValues.lineItems[0].statusCode = LineItemStatus.DISPENSED
  dispenseFormValues.prescription.statusCode = PrescriptionStatus.DISPENSED

  const result = createDispenseNotification(messageHeader, patient, medicationRequests, dispenseFormValues)
  const resultMedicationDispense = getMedicationDispenseResources(result)

  expect(resultMedicationDispense[0].quantity.value).toEqual(63)
})

test("Quantity is populated correctly for partial dispense", () => {
  dispenseFormValues.lineItems[0].priorStatusCode = LineItemStatus.TO_BE_DISPENSED
  dispenseFormValues.lineItems[0].statusCode = LineItemStatus.PARTIALLY_DISPENSED
  dispenseFormValues.lineItems[0].suppliedQuantityValue = "1"
  dispenseFormValues.prescription.statusCode = PrescriptionStatus.PARTIALLY_DISPENSED

  const result = createDispenseNotification(messageHeader, patient, medicationRequests, dispenseFormValues)
  const resultMedicationDispense = getMedicationDispenseResources(result)

  expect(resultMedicationDispense[0].quantity.value).toEqual(1)
})

test("Quantity is populated correctly for non dispenses", () => {
  dispenseFormValues.lineItems[0].statusCode = LineItemStatus.TO_BE_DISPENSED
  dispenseFormValues.lineItems[0].suppliedQuantityValue = "1"

  const result = createDispenseNotification(messageHeader, patient, medicationRequests, dispenseFormValues)
  const resultMedicationDispense = getMedicationDispenseResources(result)

  expect(resultMedicationDispense[0].quantity.value).toEqual(0)
})

test("Adds repeat information extension result when prescription is continuous repeat", () => {
  const result = createDispenseNotification(messageHeader, patient, medicationRequests, dispenseFormValues)
  const resultMedicationDispense = getMedicationDispenseResources(result)
  const repeatExtension =
    resultMedicationDispense[0].extension.find(e =>
      e.url === "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation"
    )
  expect(repeatExtension).toBeTruthy()
})

test("No repeat information extension when prescription is Acute", () => {
  medicationRequests.map(medicationRequest => {
    medicationRequest.courseOfTherapyType.coding[0].code = COURSE_OF_THERAPY_TYPE_CODES.ACUTE
  })
  const result = createDispenseNotification(messageHeader, patient, medicationRequests, dispenseFormValues)
  const resultMedicationDispense = getMedicationDispenseResources(result)
  const repeatExtension =
    resultMedicationDispense[0].extension.find(e =>
      e.url === "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation"
    )
  expect(repeatExtension).toBeFalsy()
})
