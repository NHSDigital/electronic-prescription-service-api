import {fhir} from "@models"
import {getReturnRequestTask} from "../../../../resources/test-resources"
import {
  convertTaskToDispenseProposalReturn,
  createPertinentInformation1,
  createPertinentInformation3,
  createReversalOf
} from "../../../../../src/services/translation/request/return/return"
import {DispenseProposalReturnPertinentInformation2, RepeatInstanceInfo} from "../../../../../../models/hl7-v3/return"

test("short form prescription ID is mapped correctly", () => {
  const result = createPertinentInformation1({
    system: "https://fhir.nhs.uk/Id/prescription-order-number",
    value: "88AF6C-C81007-00001C"
  })
  expect(result.pertinentPrescriptionID.value._attributes.extension).toEqual("88AF6C-C81007-00001C")
})

test("return reason is mapped correctly", () => {
  const result = createPertinentInformation3({
    coding: [{
      system: "https://fhir.nhs.uk/CodeSystem/EPS-task-dispense-return-status-reason",
      code: "0002",
      display: "Unable to dispense medication on prescriptions"
    }]
  })
  const returnReasonCode = result.pertinentReturnReason.value
  expect(returnReasonCode._attributes.code).toEqual("0002")
  expect(returnReasonCode._attributes.displayName).toEqual("Unable to dispense medication on prescriptions")
})

test("referenced message ID is mapped correctly", () => {
  const result = createReversalOf({
    system: "https://tools.ietf.org/html/rfc4122",
    value: "3495ca2b-6a1f-4835-bb5e-d328e3386684"
  })
  expect(result.priorPrescriptionReleaseResponseRef.id._attributes.root).toEqual("3495CA2B-6A1F-4835-BB5E-D328E3386684")
})

describe("Task is repeat prescription convertTaskToDispenseProposalReturn returns DispenseProposalReturnRepeat", () => {
  const returnRequestTask : fhir.Task = getReturnRequestTask()
  const result = convertTaskToDispenseProposalReturn(returnRequestTask)
  const pertientInformation2 = result.pertinentInformation2
  const pertinentRepeatInstanceInfo = pertientInformation2.pertinentRepeatInstanceInfo
  it("should have pertientInformation2", () => {
    expect(pertientInformation2).toBeInstanceOf(DispenseProposalReturnPertinentInformation2)
  })
  it("should have pertientInformation2.typeCode", () => {
    expect(pertientInformation2._attributes.typeCode).toBe("PERT")
  })
  it("should have pertientInformation2.contextConductionInd", () => {
    expect(pertientInformation2._attributes.contextConductionInd).toBe("true")
  })
  it("should have pertientInformation2.pertinentRepeatInstanceInfo", () => {
    expect(pertientInformation2.pertinentRepeatInstanceInfo).toBeInstanceOf(RepeatInstanceInfo)
  })
  it("should have pertientInformation2.pertinentRepeatInstanceInfo.classCode", () => {
    expect(pertinentRepeatInstanceInfo._attributes.classCode).toBe("OBS")
  })
  it("should have pertientInformation2.pertinentRepeatInstanceInfo.moodCode", () => {
    expect(pertinentRepeatInstanceInfo._attributes.moodCode).toBe("EVN")
  })

  it("should have pertientInformation2.pertinentRepeatInstanceInfo.value equal to numberOfRepeatsIssued ", () => {
    expect(pertinentRepeatInstanceInfo.value).toBe(2)
  })

})
