import {
  getLineItemStatusCode,
  getPrescriptionStatus,
  translateDispenseNotification
} from "../../../../src/services/translation/request/prescription/prescription-dispense"
import * as TestResources from "../../../resources/test-resources"
import requireActual = jest.requireActual
import {MomentFormatSpecification, MomentInput} from "moment"
import * as hl7V3 from "../../../../src/models/hl7-v3"
import * as fhir from "../../../../src/models/fhir"
import {onlyElement, toArray} from "../../../../src/services/translation/common"
import {clone} from "../../../resources/test-helpers"
import {
  getMedicationDispenses, getMessageHeader
} from "../../../../src/services/translation/common/getResourcesOfType"
import {ElementCompact} from "xml-js"

const actualMoment = requireActual("moment")
jest.mock("moment", () => ({
  utc: (input?: MomentInput, format?: MomentFormatSpecification) =>
    actualMoment.utc(input || "2020-12-18T12:34:34Z", format)
}))

describe("convertPrescriptionDispense", () => {
  const cases = toArray(TestResources.examplePrescription3)
    .map((example: TestResources.ExamplePrescription) => [
      example.description,
      example.fhirMessageDispense,
      // eslint-disable-next-line max-len
      example.hl7V3MessageDispense.PORX_IN080101SM31.ControlActEvent.subject.DispenseNotification as hl7V3.DispenseNotification
    ])

  test.each(cases)("accepts %s", (desc: string, input: fhir.Bundle) => {
    expect(() => translateDispenseNotification(input)).not.toThrow()
  })
})

describe("getLineItemStatusCode", () => {
  const cases = [
    /* eslint-disable max-len */
    [{code: "0001", display: "Item fully dispensed"} as fhir.Coding, createItemStatusCode("0001", "Item fully dispensed")._attributes],
    [{code: "0002", display: "Item not dispensed"} as fhir.Coding, createItemStatusCode("0002", "Item not dispensed")._attributes],
    [{code: "0003", display: "Item dispensed - partial"}, createItemStatusCode("0003", "Item dispensed - partial")._attributes],
    [{code: "0004", display: "Item not dispensed owing"} as fhir.Coding, createItemStatusCode("0004", "Item not dispensed owing")._attributes],
    [{code: "0005", display: "Item cancelled"} as fhir.Coding, createItemStatusCode("0005", "Item cancelled")._attributes],
    [{code: "0006", display: "Expired"} as fhir.Coding, createItemStatusCode("0006", "Expired")._attributes],
    [{code: "0007", display: "Item to be dispensed"} as fhir.Coding, createItemStatusCode("0007", "Item to be dispensed")._attributes],
    [{code: "0008", display: "Item with dispenser"} as fhir.Coding, createItemStatusCode("0008", "Item with dispenser")._attributes]
    /* eslint-enable max-len */
  ]

  test.each(cases)(
    "when item status is %p, getLineItemStatusCode returns prescription item status %p",
    (code: fhir.Coding, expected: ElementCompact) => {
      const bundle = clone(TestResources.examplePrescription3.fhirMessageDispense)
      const fhirMedicationDispenses = getMedicationDispenses(bundle)
      expect(fhirMedicationDispenses.length).toBeGreaterThan(0)
      fhirMedicationDispenses.map(medicationDispense => {
        setItemStatusCode(medicationDispense, code)
        medicationDispense.type.coding.forEach(coding => {
          const itemStatusCode = getLineItemStatusCode(coding)._attributes
          expect(itemStatusCode).toEqual(expected)
        })
      })
    }
  )
})

describe("getPrescriptionStatus", () => {
  const cases = [
    /* eslint-disable max-len */
    [{code: "0001", display: "To be Dispensed"} as fhir.Coding, createStatusCode("0001", "To be Dispensed")._attributes],
    [{code: "0002", display: "With Dispenser"} as fhir.Coding, createStatusCode("0002", "With Dispenser")._attributes],
    [{code: "0003", display: "With Dispenser - Active"}, createStatusCode("0003", "With Dispenser - Active")._attributes],
    [{code: "0004", display: "Expired"} as fhir.Coding, createStatusCode("0004", "Expired")._attributes],
    [{code: "0005", display: "Cancelled"} as fhir.Coding, createStatusCode("0005", "Cancelled")._attributes],
    [{code: "0006", display: "Dispensed"} as fhir.Coding, createStatusCode("0006", "Dispensed")._attributes],
    [{code: "0007", display: "Not Dispensed"} as fhir.Coding, createStatusCode("0007", "Not Dispensed")._attributes]
    /* eslint-enable max-len */
  ]

  test.each(cases)(
    "when status is %p, getPrescriptionStatus returns prescription status %p",
    (code: fhir.Coding, expected: ElementCompact) => {
      const bundle = clone(TestResources.examplePrescription3.fhirMessageDispense)
      const fhirMedicationDispenses = getMedicationDispenses(bundle)
      expect(fhirMedicationDispenses.length).toBeGreaterThan(0)
      fhirMedicationDispenses.map(medicationDispense => {
        setStatusCode(medicationDispense, code)
        const prescriptionStatus = getPrescriptionStatus(medicationDispense)
        expect(prescriptionStatus.valueCoding.code).toEqual(expected.code)
        expect(prescriptionStatus.valueCoding.display).toEqual(expected.displayName)
      })
    }
  )
})

describe("fhir MessageHeader maps correct values in DispenseNotificiation", () => {
  let dispenseNotification: fhir.Bundle
  let messageHeader: fhir.MessageHeader
  beforeEach(() => {
    dispenseNotification = clone(TestResources.examplePrescription3.fhirMessageDispense)
    messageHeader = getMessageHeader(dispenseNotification)
  })

  test("destination.receiver.identifier maps to primaryInformationRecipient.AgentOrg.agentOrganization", () => {
    const fhirMessageDestination = onlyElement(messageHeader.destination, "MessageHeader.destination")
    fhirMessageDestination.receiver.identifier.value = "XX-TEST-VALUE"

    const hl7dispenseNotification = translateDispenseNotification(dispenseNotification)

    expect(
      fhirMessageDestination
        .receiver.identifier.value
    ).toEqual(
      hl7dispenseNotification
        .primaryInformationRecipient.AgentOrg.agentOrganization.id._attributes.extension
    )
  })

  test("destination.receiver.display maps to primaryInformationRecipient.AgentOrg.agentOrganization", () => {
    const fhirMessageDestination = onlyElement(messageHeader.destination, "MessageHeader.destination")
    fhirMessageDestination.receiver.display = "XX-TEST-VALUE"

    const hl7dispenseNotification = translateDispenseNotification(dispenseNotification)
    
    expect(
      fhirMessageDestination
        .receiver.display
    ).toEqual(
      hl7dispenseNotification
        .primaryInformationRecipient.AgentOrg.agentOrganization.name._text
    )
  })

  test("sender.identifier.value maps to pertinentInformation1.pertinentSupplyHeader.author.AgentPerson", () => {
    messageHeader.sender.identifier.value = "XX-TEST-VALUE"

    const hl7dispenseNotification = translateDispenseNotification(dispenseNotification)
    
    expect(
      messageHeader.sender.identifier.value
    ).toEqual(
      hl7dispenseNotification
        .pertinentInformation1.pertinentSupplyHeader.author.AgentPerson.representedOrganization.id._attributes.extension
    )
    expect(
      messageHeader.sender.identifier.value
    ).toEqual(
      hl7dispenseNotification
        .pertinentInformation1.pertinentSupplyHeader.author.AgentPerson.code._attributes.code
    )
  })

  test("sender.display maps to pertinentInformation1.pertinentSupplyHeader.author.AgentPerson", () => {
    messageHeader.sender.display = "XX-TEST-VALUE"

    const hl7dispenseNotification = translateDispenseNotification(dispenseNotification)
    
    expect(
      messageHeader.sender.display
    ).toEqual(
      hl7dispenseNotification
        .pertinentInformation1.pertinentSupplyHeader.author.AgentPerson.representedOrganization.name._text
    )
  })

  test("response.identifier maps to sequelTo.priorPrescriptionReleaseEventRef.id", () => {
    messageHeader.response.identifier = "XX-TEST-VALUE"

    const hl7dispenseNotification = translateDispenseNotification(dispenseNotification)
    
    expect(
      messageHeader.response.identifier
    ).toEqual(
      hl7dispenseNotification
        .sequelTo.priorPrescriptionReleaseEventRef.id._attributes.root
    )
  })
})

function createStatusCode(code: string, display: string): hl7V3.StatusCode {
  const statusCode = new hl7V3.StatusCode(code)
  statusCode._attributes.displayName = display
  return statusCode
}

function createItemStatusCode(code: string, display: string): hl7V3.ItemStatusCode {
  const itemStatusCode = new hl7V3.ItemStatusCode(code)
  itemStatusCode._attributes.displayName = display
  return itemStatusCode
}

function setStatusCode(
  medicationDispense: fhir.MedicationDispense,
  newStatusCoding: fhir.Coding
): void {
  const prescriptionStatus = getPrescriptionStatus(medicationDispense)
  prescriptionStatus.valueCoding.code = newStatusCoding.code
  prescriptionStatus.valueCoding.display = newStatusCoding.display
}

function setItemStatusCode(
  medicationDispense: fhir.MedicationDispense,
  newItemStatusCoding: fhir.Coding
): void {
  medicationDispense.type.coding = [newItemStatusCoding]
}
