import {
  createPertinentInformation1,
  createPertinentInformation2,
  createPertinentInformation3,
  createPertinentInformation4,
  createPertinentInformation5,
  createRecordTarget
} from "../../../../../src/services/translation/request/withdraw/withdraw"

test("NHS number is mapped correctly", () => {
  const result = createRecordTarget({
    system: "https://fhir.nhs.uk/Id/nhs-number",
    value: "9446368138"
  })
  expect(result.patient.id._attributes.extension).toEqual("9446368138")
})

test("repeatInstanceInfo is mapped correctly", () => {
  const result = createPertinentInformation1("3")
  expect(result.RepeatInstanceInfo.value).toEqual("4")
  expect(result.RepeatInstanceInfo.code._attributes.codeSystem).toEqual("2.16.840.1.113883.2.1.3.2.4.17.30")
  expect(result.RepeatInstanceInfo.code._attributes.code).toEqual("RPI")
})

test("short form prescription ID is mapped correctly", () => {
  const result = createPertinentInformation3({
    system: "https://fhir.nhs.uk/Id/prescription-order-number",
    value: "88AF6C-C81007-00001C"
  })
  expect(result.pertinentWithdrawID.value._attributes.extension).toEqual("88AF6C-C81007-00001C")
})

test("withdraw type is populated with hard coded value", () => {
  const result = createPertinentInformation2()
  const withdrawTypeCode = result.pertinentWithdrawType.value
  expect(withdrawTypeCode._attributes.code).toEqual("LD")
  expect(withdrawTypeCode._attributes.displayName).toEqual("Last Dispense")
})

test("withdraw reason is mapped correctly", () => {
  const result = createPertinentInformation5({
    coding: [{
      system: "https://fhir.nhs.uk/CodeSystem/EPS-task-dispense-withdraw-reason",
      code: "DA",
      display: "Dosage Amendments"
    }]
  })
  const withdrawReasonCode = result.pertinentWithdrawReason.value
  expect(withdrawReasonCode._attributes.code).toEqual("DA")
  expect(withdrawReasonCode._attributes.displayName).toEqual("Dosage Amendments")
})

test("referenced message ID is mapped correctly", () => {
  const result = createPertinentInformation4({
    system: "https://tools.ietf.org/html/rfc4122",
    value: "334a3195-1f6c-497a-8efe-d272ca9c4e38"
  })
  expect(result.pertinentDispenseNotificationRef.id._attributes.root).toEqual("334A3195-1F6C-497A-8EFE-D272CA9C4E38")
})
