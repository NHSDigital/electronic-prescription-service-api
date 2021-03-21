import {
  createAndAddCommunicationRequest,
  createAndAddList,
  parseAdditionalInstructions
} from "../../../../../src/services/translation/response/release/additional-instructions"
import * as fhir from "@models/fhir"

describe("parseAdditionalInstructions", () => {
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

  test("handles interleaved medication and patient info", () => {
    const thing = parseAdditionalInstructions(
      // eslint-disable-next-line max-len
      "<patientInfo>Patient info 1</patientInfo><medication>Medication 1</medication><patientInfo>Patient info 2</patientInfo><medication>Medication 2</medication>"
    )
    expect(thing.medication).toEqual(["Medication 1", "Medication 2"])
    expect(thing.patientInfo).toEqual(["Patient info 1", "Patient info 2"])
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
})

describe("communication request", () => {
  const examplePatientId = "patientId"
  let bundleResources: Array<fhir.Resource>
  beforeEach(() => {
    bundleResources = []
  })

  test("contains id", () => {
    createAndAddCommunicationRequest(examplePatientId, [], [], bundleResources)
    const communicationRequest = bundleResources.find(resource => resource.resourceType === "CommunicationRequest")
    expect(communicationRequest.id).toBeTruthy()
  })

  test("contains patient reference", () => {
    createAndAddCommunicationRequest(examplePatientId, [], [], bundleResources)
    const communicationRequest = bundleResources.find(resource => resource.resourceType === "CommunicationRequest")
    expect(communicationRequest).toMatchObject<Partial<fhir.CommunicationRequest>>({
      subject: {
        reference: "urn:uuid:patientId"
      }
    })
  })

  test("handles single patient info", () => {
    createAndAddCommunicationRequest(examplePatientId, [], ["Patient info"], bundleResources)
    const list = bundleResources.find(resource => resource.resourceType === "List")
    expect(list).toBeFalsy()
    const communicationRequest = bundleResources.find(resource => resource.resourceType === "CommunicationRequest")
    expect(communicationRequest).toMatchObject<Partial<fhir.CommunicationRequest>>({
      payload: [{
        contentString: "Patient info"
      }]
    })
  })

  test("handles multiple patient info", () => {
    createAndAddCommunicationRequest(examplePatientId, [], ["Patient info 1", "Patient info 2"], bundleResources)
    const list = bundleResources.find(resource => resource.resourceType === "List")
    expect(list).toBeFalsy()
    const communicationRequest = bundleResources.find(resource => resource.resourceType === "CommunicationRequest")
    expect(communicationRequest).toMatchObject<Partial<fhir.CommunicationRequest>>({
      payload: [
        {
          contentString: "Patient info 1"
        },
        {
          contentString: "Patient info 2"
        }
      ]
    })
  })

  test("handles single medication", () => {
    createAndAddCommunicationRequest(examplePatientId, ["Medication"], [], bundleResources)
    const list = bundleResources.find(resource => resource.resourceType === "List")
    expect(list).toMatchObject<Partial<fhir.List>>({
      entry: [{
        item: {
          display: "Medication"
        }
      }]
    })
    const communicationRequest = bundleResources.find(resource => resource.resourceType === "CommunicationRequest")
    expect(communicationRequest).toMatchObject<Partial<fhir.CommunicationRequest>>({
      payload: [{
        contentReference: {
          reference: `urn:uuid:${list.id}`
        }
      }]
    })
  })

  test("handles multiple medication", () => {
    createAndAddCommunicationRequest(examplePatientId, ["Medication 1", "Medication 2"], [], bundleResources)
    const list = bundleResources.find(resource => resource.resourceType === "List")
    expect(list).toMatchObject<Partial<fhir.List>>({
      entry: [
        {
          item: {
            display: "Medication 1"
          }
        },
        {
          item: {
            display: "Medication 2"
          }
        }
      ]
    })
    const communicationRequest = bundleResources.find(resource => resource.resourceType === "CommunicationRequest")
    expect(communicationRequest).toMatchObject<Partial<fhir.CommunicationRequest>>({
      payload: [{
        contentReference: {
          reference: `urn:uuid:${list.id}`
        }
      }]
    })
  })
})

describe("list", () => {
  let bundleResources: Array<fhir.Resource>
  beforeEach(() => {
    bundleResources = []
  })

  test("contains id", () => {
    createAndAddList(["Item"], bundleResources)
    const list = bundleResources.find(resource => resource.resourceType === "List")
    expect(list.id).toBeTruthy()
  })

  test("handles single entry", () => {
    createAndAddList(["Item"], bundleResources)
    const list = bundleResources.find(resource => resource.resourceType === "List")
    expect(list).toMatchObject<Partial<fhir.List>>({
      entry: [{
        item: {
          display: "Item"
        }
      }]
    })
  })

  test("handles multiple entries", () => {
    createAndAddList(["Item 1", "Item 2"], bundleResources)
    const list = bundleResources.find(resource => resource.resourceType === "List")
    expect(list).toMatchObject<Partial<fhir.List>>({
      entry: [
        {
          item: {
            display: "Item 1"
          }
        },
        {
          item: {
            display: "Item 2"
          }
        }
      ]
    })
  })
})
