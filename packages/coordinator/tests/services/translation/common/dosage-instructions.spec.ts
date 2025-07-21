import {fhir} from "@models"
import {pino} from "pino"
import {
  getDosageInstruction,
  getDosageInstructionFromMedicationDispense
} from "../../../../src/services/translation/common/dosage-instructions"
import {MedicationDispense} from "../../../../../models/fhir"
import {LosslessNumber} from "lossless-json"

describe("dosage-instructions", () => {
  const logger: pino.Logger = jest.createMockFromModule("pino")
  let medicationDispense: Partial<fhir.MedicationDispense>
  let dosageInstruction: Array<Partial<fhir.Dosage>>
  let expectedDosageInstruction: string

  const ZERO = new LosslessNumber("0")
  const ONE = new LosslessNumber("1")
  const TWO = new LosslessNumber("2")

  function testFromDosageInstructionAndMedicationDispense() {
    expect(getDosageInstructionFromMedicationDispense(medicationDispense as MedicationDispense, logger)).toBe(
      expectedDosageInstruction
    )
    expect(getDosageInstruction(dosageInstruction)).toBe(expectedDosageInstruction)
  }

  beforeEach(() => {
    medicationDispense = {}
    dosageInstruction = []
  })
  describe("correctly extracts dosage instructions from", () => {
    describe("single dosage instruction", () => {
      beforeEach(() => {
        dosageInstruction = [{text: "Test instruction"}]
        medicationDispense = {dosageInstruction: dosageInstruction}
        expectedDosageInstruction = "Test instruction"
      })
      test("without sequencing value", () => {
        testFromDosageInstructionAndMedicationDispense()
      })
      test("with sequencing value", () => {
        dosageInstruction[0].sequence = ZERO

        testFromDosageInstructionAndMedicationDispense()
      })
    })
    test("concurrent dosage instructions", () => {
      dosageInstruction = [
        {text: "Test instruction 1", sequence: ZERO},
        {text: "Test instruction 2", sequence: ZERO}
      ]
      medicationDispense = {dosageInstruction: dosageInstruction}
      expectedDosageInstruction = "Test instruction 1, and Test instruction 2"

      testFromDosageInstructionAndMedicationDispense()
    })
    test("consecutive dosage instructions", () => {
      dosageInstruction = [
        {text: "Test instruction 1", sequence: ZERO},
        {text: "Test instruction 2", sequence: ONE}
      ]
      medicationDispense = {dosageInstruction: dosageInstruction}
      expectedDosageInstruction = "Test instruction 1, then Test instruction 2"

      testFromDosageInstructionAndMedicationDispense()
    })
    test("concurrent and consecutive dosage instructions", () => {
      dosageInstruction = [
        {text: "Test instruction 1", sequence: ZERO},
        {text: "Test instruction 2", sequence: ZERO},
        {text: "Test instruction 3", sequence: ONE},
        {text: "Test instruction 4", sequence: ONE}
      ]
      medicationDispense = {dosageInstruction: dosageInstruction}
      expectedDosageInstruction =
        "Test instruction 1, and Test instruction 2, then Test instruction 3, and Test instruction 4"

      testFromDosageInstructionAndMedicationDispense()
    })
    test("concurrent and consecutive dosage instructions when out of order", () => {
      dosageInstruction = [
        {text: "Test instruction 1", sequence: ZERO},
        {text: "Test instruction 3", sequence: ONE},
        {text: "Test instruction 4", sequence: ONE},
        {text: "Test instruction 2", sequence: ZERO}
      ]
      medicationDispense = {dosageInstruction: dosageInstruction}
      expectedDosageInstruction =
        "Test instruction 1, and Test instruction 2, then Test instruction 3, and Test instruction 4"

      testFromDosageInstructionAndMedicationDispense()
    })
    test("discontinuous dosage instructions", () => {
      dosageInstruction = [
        {text: "Test instruction 1", sequence: ZERO},
        {text: "Test instruction 2", sequence: ZERO},
        {text: "Test instruction 3", sequence: TWO},
        {text: "Test instruction 4", sequence: TWO}
      ]
      medicationDispense = {dosageInstruction: dosageInstruction}
      expectedDosageInstruction =
        "Test instruction 1, and Test instruction 2, then Test instruction 3, and Test instruction 4"

      testFromDosageInstructionAndMedicationDispense()
    })
    describe("dosage sequencing starting at", () => {
      test("0", () => {
        dosageInstruction = [
          {text: "Test instruction 1", sequence: ZERO},
          {text: "Test instruction 2", sequence: ZERO},
          {text: "Test instruction 3", sequence: ONE},
          {text: "Test instruction 4", sequence: ONE}
        ]
        medicationDispense = {dosageInstruction: dosageInstruction}
        expectedDosageInstruction =
          "Test instruction 1, and Test instruction 2, then Test instruction 3, and Test instruction 4"

        testFromDosageInstructionAndMedicationDispense()
      })
      test("1", () => {
        dosageInstruction = [
          {text: "Test instruction 1", sequence: ONE},
          {text: "Test instruction 2", sequence: ONE},
          {text: "Test instruction 3", sequence: TWO},
          {text: "Test instruction 4", sequence: TWO}
        ]
        medicationDispense = {dosageInstruction: dosageInstruction}
        expectedDosageInstruction =
          "Test instruction 1, and Test instruction 2, then Test instruction 3, and Test instruction 4"

        testFromDosageInstructionAndMedicationDispense()
      })
    })
    test("instructions containing null text", () => {
      dosageInstruction = [
        {text: "Test instruction 1", sequence: ZERO},
        {sequence: ZERO},
        {sequence: ONE},
        {text: "Test instruction 4", sequence: ONE}
      ]
      medicationDispense = {dosageInstruction: dosageInstruction}
      expectedDosageInstruction = "Test instruction 1, and , then , and Test instruction 4"

      testFromDosageInstructionAndMedicationDispense()
    })
  })

  describe("throws error when given", () => {
    test("incomplete dosage sequencing", () => {
      dosageInstruction = [
        {text: "Test instruction 1", sequence: ZERO},
        {text: "Test instruction 2", sequence: ZERO},
        {text: "Test instruction 3"},
        {text: "Test instruction 4", sequence: ONE}
      ]

      medicationDispense = {dosageInstruction: dosageInstruction}

      expect(testFromDosageInstructionAndMedicationDispense).toThrow(
        new Error("Dosage instructions lacking complete sequencing")
      )
    })
    test("a null input", () => {
      expect(testFromDosageInstructionAndMedicationDispense).toThrow(new Error("Dosage instructions not provided"))
    })
  })
})
