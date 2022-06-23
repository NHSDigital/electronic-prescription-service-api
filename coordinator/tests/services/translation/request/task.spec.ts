import {
  getMessageIdFromTaskFocusIdentifier,
  getPrescriptionShortFormIdFromTaskGroupIdentifier
} from "../../../../src/services/translation/request/task"

test("short form id is extracted correctly", () => {
  const result = getPrescriptionShortFormIdFromTaskGroupIdentifier({
    system: "https://fhir.nhs.uk/Id/prescription-order-number",
    value: "88AF6C-C81007-00001C"
  })
  expect(result).toEqual("88AF6C-C81007-00001C")
})

test("referenced message id is extracted correctly", () => {
  const result = getMessageIdFromTaskFocusIdentifier({
    system: "https://tools.ietf.org/html/rfc4122",
    value: "d72bd9c8-b8d6-4c69-90ee-9ad7f177877b"
  })
  expect(result).toEqual("d72bd9c8-b8d6-4c69-90ee-9ad7f177877b")
})
