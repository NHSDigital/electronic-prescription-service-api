import {
  parseAdditionalInstructions
} from "../../../../../src/services/translation/incoming/release/additional-instructions"

test("handles empty", () => {
  const thing = parseAdditionalInstructions(
    ""
  )
  expect(thing.medication).toEqual([])
  expect(thing.patientInfo).toEqual([])
  expect(thing.controlledDrugWords).toEqual("")
  expect(thing.additionalInstructions).toEqual("")
})

test("handles single patientInfo", () => {
  const thing = parseAdditionalInstructions(
    "<patientInfo>Patient info</patientInfo>"
  )
  expect(thing.medication).toEqual([])
  expect(thing.patientInfo).toEqual(["Patient info"])
  expect(thing.controlledDrugWords).toEqual("")
  expect(thing.additionalInstructions).toEqual("")
})

test("handles multiple patientInfo", () => {
  const thing = parseAdditionalInstructions(
    "<patientInfo>Patient info 1</patientInfo><patientInfo>Patient info 2</patientInfo>"
  )
  expect(thing.medication).toEqual([])
  expect(thing.patientInfo).toEqual(["Patient info 1", "Patient info 2"])
  expect(thing.controlledDrugWords).toEqual("")
  expect(thing.additionalInstructions).toEqual("")
})

test("handles single medication", () => {
  const thing = parseAdditionalInstructions(
    "<medication>Medication</medication>"
  )
  expect(thing.medication).toEqual(["Medication"])
  expect(thing.patientInfo).toEqual([])
  expect(thing.controlledDrugWords).toEqual("")
  expect(thing.additionalInstructions).toEqual("")
})

test("handles multiple medication", () => {
  const thing = parseAdditionalInstructions(
    "<medication>Medication 1</medication><medication>Medication 2</medication>"
  )
  expect(thing.medication).toEqual(["Medication 1", "Medication 2"])
  expect(thing.patientInfo).toEqual([])
  expect(thing.controlledDrugWords).toEqual("")
  expect(thing.additionalInstructions).toEqual("")
})

test("handles medication and patient info", () => {
  const thing = parseAdditionalInstructions(
    "<medication>Medication</medication><patientInfo>Patient info</patientInfo>"
  )
  expect(thing.medication).toEqual(["Medication"])
  expect(thing.patientInfo).toEqual(["Patient info"])
  expect(thing.controlledDrugWords).toEqual("")
  expect(thing.additionalInstructions).toEqual("")
})

test("handles medication and patient info in other order", () => {
  const thing = parseAdditionalInstructions(
    "<patientInfo>Patient info</patientInfo><medication>Medication</medication>"
  )
  expect(thing.medication).toEqual(["Medication"])
  expect(thing.patientInfo).toEqual(["Patient info"])
  expect(thing.controlledDrugWords).toEqual("")
  expect(thing.additionalInstructions).toEqual("")
})

test("handles controlled drug words", () => {
  const thing = parseAdditionalInstructions(
    "CD: twenty eight"
  )
  expect(thing.medication).toEqual([])
  expect(thing.patientInfo).toEqual([])
  expect(thing.controlledDrugWords).toEqual("twenty eight")
  expect(thing.additionalInstructions).toEqual("")
})

test("handles additional instructions", () => {
  const thing = parseAdditionalInstructions(
    "Additional instructions"
  )
  expect(thing.medication).toEqual([])
  expect(thing.patientInfo).toEqual([])
  expect(thing.controlledDrugWords).toEqual("")
  expect(thing.additionalInstructions).toEqual("Additional instructions")
})

test("handles controlled drug words and other instructions", () => {
  const thing = parseAdditionalInstructions(
    "CD: twenty eight\nAdditional instructions"
  )
  expect(thing.medication).toEqual([])
  expect(thing.patientInfo).toEqual([])
  expect(thing.controlledDrugWords).toEqual("twenty eight")
  expect(thing.additionalInstructions).toEqual("Additional instructions")
})

test("handles multiline additional instructions", () => {
  const thing = parseAdditionalInstructions(
    "Additional instructions line 1\nAdditional instructions line 2"
  )
  expect(thing.medication).toEqual([])
  expect(thing.patientInfo).toEqual([])
  expect(thing.controlledDrugWords).toEqual("")
  expect(thing.additionalInstructions).toEqual("Additional instructions line 1\nAdditional instructions line 2")
})

test("handles controlled drug words and multiline additional instructions", () => {
  const thing = parseAdditionalInstructions(
    "CD: twenty eight\nAdditional instructions line 1\nAdditional instructions line 2"
  )
  expect(thing.medication).toEqual([])
  expect(thing.patientInfo).toEqual([])
  expect(thing.controlledDrugWords).toEqual("twenty eight")
  expect(thing.additionalInstructions).toEqual("Additional instructions line 1\nAdditional instructions line 2")
})

test("handles XML chars in additional instructions", () => {
  const thing = parseAdditionalInstructions(
    "<medication>Medication</medication>Line < 2\nLine > 1"
  )
  expect(thing.medication).toEqual(["Medication"])
  expect(thing.patientInfo).toEqual([])
  expect(thing.controlledDrugWords).toEqual("")
  expect(thing.additionalInstructions).toEqual("Line < 2\nLine > 1")
})

test("handles all fields", () => {
  const thing = parseAdditionalInstructions(
    // eslint-disable-next-line max-len
    "<medication>Medication</medication><patientInfo>Patient info</patientInfo>CD: twenty eight\nAdditional instructions"
  )
  expect(thing.medication).toEqual(["Medication"])
  expect(thing.patientInfo).toEqual(["Patient info"])
  expect(thing.controlledDrugWords).toEqual("twenty eight")
  expect(thing.additionalInstructions).toEqual("Additional instructions")
})
