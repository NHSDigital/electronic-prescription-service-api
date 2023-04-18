import {fhir} from "@models"
import {specification, getReturnRequestTask} from "../../../../resources/test-resources"
import {
  convertTaskToDispenseProposalReturn,
  createPertinentInformation1,
  createPertinentInformation3,
  createReversalOf
} from "../../../../../src/services/translation/request/return/return"
import {
  DispenseProposalReturn,
  DispenseProposalReturnPertinentInformation2,
  DispenseProposalReturnRepeat,
  RepeatInstanceInfo
} from "../../../../../../models/hl7-v3/return"

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
  const result = convertTaskToDispenseProposalReturn(returnRequestTask) as DispenseProposalReturnRepeat
  const pertinentInformation2 = result.pertinentInformation2
  const pertinentRepeatInstanceInfo = pertinentInformation2.pertinentRepeatInstanceInfo
  it("should have pertinentInformation2", () => {
    expect(pertinentInformation2).toBeInstanceOf(DispenseProposalReturnPertinentInformation2)
  })
  it("should have pertinentInformation2.typeCode", () => {
    expect(pertinentInformation2._attributes.typeCode).toBe("PERT")
  })
  it("should have pertinentInformation2.contextConductionInd", () => {
    expect(pertinentInformation2._attributes.contextConductionInd).toBe("true")
  })
  it("should have pertinentInformation2.pertinentRepeatInstanceInfo", () => {
    expect(pertinentInformation2.pertinentRepeatInstanceInfo).toBeInstanceOf(RepeatInstanceInfo)
  })
  it("should have pertinentInformation2.pertinentRepeatInstanceInfo.classCode", () => {
    expect(pertinentRepeatInstanceInfo._attributes.classCode).toBe("OBS")
  })
  it("should have pertinentInformation2.pertinentRepeatInstanceInfo.moodCode", () => {
    expect(pertinentRepeatInstanceInfo._attributes.moodCode).toBe("EVN")
  })
  it("should have pertinentInformation2.pertinentRepeatInstanceInfo.value equals numberOfRepeatsIssued ", () => {
    expect(pertinentRepeatInstanceInfo.value._attributes.value).toBe("3")
  })

  it("should have pertinentInformation2.pertinentRepeatInstanceInfo.code.code equal to RPI ", () => {
    expect(pertinentRepeatInstanceInfo.code._attributes.code).toBe("RPI")
  })

  it("should have pertinentInformation2.pertinentRepeatInstanceInfo.code.codeSystem to be Assigned OID", () => {
    expect(pertinentRepeatInstanceInfo.code._attributes.codeSystem).toBe("2.16.840.1.113883.2.1.3.2.4.17.30")
  })

})

describe("Task for acute convertTaskToDispenseProposalReturn returns DispenseProposalReturn", () => {
  const returnRequestTask : fhir.Task = specification[2].fhirMessageReturnRequest
  const result = convertTaskToDispenseProposalReturn(returnRequestTask)
  it("should have pertinentInformation2", () => {
    expect(result).toBeInstanceOf(DispenseProposalReturn)
  })
})
