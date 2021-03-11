import {
  getFhirGroupIdentifierExtension,
  createLineItemStatusCode,
  getPrescriptionItemNumber,
  getPrescriptionStatus,
  convertDispenseNotification
} from "../../../../src/services/translation/request/prescribe/prescription-dispense"
import * as TestResources from "../../../resources/test-resources"
import requireActual = jest.requireActual
import {MomentFormatSpecification, MomentInput} from "moment"
import * as hl7V3 from "../../../../src/models/hl7-v3"
import * as fhir from "../../../../src/models/fhir"
import {
  getExtensionForUrl,
  onlyElement,
  toArray
} from "../../../../src/services/translation/common"
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
    expect(() => convertDispenseNotification(input)).not.toThrow()
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
          const itemStatusCode = createLineItemStatusCode(coding)._attributes
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

    const hl7dispenseNotification = convertDispenseNotification(dispenseNotification)

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

    const hl7dispenseNotification = convertDispenseNotification(dispenseNotification)

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

    const hl7dispenseNotification = convertDispenseNotification(dispenseNotification)

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

    const hl7dispenseNotification = convertDispenseNotification(dispenseNotification)

    expect(
      messageHeader.sender.display
    ).toEqual(
      hl7dispenseNotification
        .pertinentInformation1.pertinentSupplyHeader.author.AgentPerson.representedOrganization.name._text
    )
  })

  test("response.identifier maps to sequelTo.priorPrescriptionReleaseEventRef.id", () => {
    messageHeader.response.identifier = "XX-TEST-VALUE"

    const hl7dispenseNotification = convertDispenseNotification(dispenseNotification)

    expect(
      messageHeader.response.identifier
    ).toEqual(
      hl7dispenseNotification
        .sequelTo.priorPrescriptionReleaseEventRef.id._attributes.root
    )
  })
})

describe("fhir MedicationDispense maps correct values in DispenseNotificiation", () => {
  let dispenseNotification: fhir.Bundle
  let medicationDispenses: Array<fhir.MedicationDispense>
  beforeEach(() => {
    dispenseNotification = clone(TestResources.examplePrescription3.fhirMessageDispense)
    medicationDispenses = getMedicationDispenses(dispenseNotification)
    expect(medicationDispenses.length).toBeGreaterThan(0)
  })

  // eslint-disable-next-line max-len
  test("identifier.value maps to pertinentInformation1.pertinentSupplyHeader.pertinentInformation1.pertinentSuppliedLineItem.id", () => {
    medicationDispenses.forEach(medicationDispense => setPrescriptionItemNumber(medicationDispense, "XX-TEST-VALUE"))

    const hl7dispenseNotification = convertDispenseNotification(dispenseNotification)

    medicationDispenses.map((medicationDispense, index) => {
      expect(
        getPrescriptionItemNumber(medicationDispense)
      ).toEqual(
        hl7dispenseNotification
          .pertinentInformation1
          .pertinentSupplyHeader
          .pertinentInformation1[index]
          .pertinentSuppliedLineItem.id._attributes.root
      )
    })
  })

  // eslint-disable-next-line max-len
  test("medicationCodeableConcept.coding maps to pertinentInformation1.pertinentSupplyHeader.pertinentInformation1.pertinentSuppliedLineItem.component.suppliedLineItemQuantity.product.suppliedManufacturedProduct.manufacturedSuppliedMaterial.code", () => {
    medicationDispenses.forEach(medicationDispense =>
      setMedicationCodeableConcept(medicationDispense, "XX-TEST-VALUE", "XX-TEST-VALUE-DISPLAY")
    )

    const hl7dispenseNotification = convertDispenseNotification(dispenseNotification)

    medicationDispenses.map((_, index) => {
      expect(
        "XX-TEST-VALUE"
      ).toEqual(
        hl7dispenseNotification
          .pertinentInformation1
          .pertinentSupplyHeader
          .pertinentInformation1[index]
          .pertinentSuppliedLineItem
          .component
          .suppliedLineItemQuantity
          .product
          .suppliedManufacturedProduct
          .manufacturedSuppliedMaterial
          .code
          ._attributes.code
      )
      expect(
        "XX-TEST-VALUE-DISPLAY"
      ).toEqual(
        hl7dispenseNotification
          .pertinentInformation1
          .pertinentSupplyHeader
          .pertinentInformation1[index]
          .pertinentSuppliedLineItem
          .component
          .suppliedLineItemQuantity
          .product
          .suppliedManufacturedProduct
          .manufacturedSuppliedMaterial
          .code
          ._attributes.displayName
      )
    })
  })

  test("subject.Patient.value maps to recordTarget.patient.id.extension", () => {
    medicationDispenses.forEach(medicationDispense => setPatientId(medicationDispense, "XX-TEST-VALUE"))

    const hl7dispenseNotification = convertDispenseNotification(dispenseNotification)

    medicationDispenses.map((medicationDispense) => {
      expect(
        medicationDispense.subject.identifier.value
      ).toEqual(
        hl7dispenseNotification.recordTarget.patient.id._attributes.extension
      )
    })
  })

  // eslint-disable-next-line max-len
  test("performer.actor.(type === 'Practitioner') maps to pertinentInformation1.pertinentSupplyHeader.author.AgentPerson.agentPerson", () => {
    medicationDispenses.forEach(medicationDispense => setPractitionerName(medicationDispense, "XX-TEST-VALUE"))

    const hl7dispenseNotification = convertDispenseNotification(dispenseNotification)

    medicationDispenses.map((medicationDispense) => {
      expect(
        medicationDispense
          .performer
          .map(p => p.actor)
          .find(a => a.type === "Practitioner")
          .display
      ).toEqual(
        hl7dispenseNotification.pertinentInformation1.pertinentSupplyHeader.author.AgentPerson.agentPerson.name._text
      )
    })
  })

  test("authorizingPrescription maps to pertinentInformation1.pertinentSupplyHeader", () => {
    medicationDispenses.forEach(medicationDispense =>
      setAuthorizingPrescriptionValues(
        medicationDispense,
        "XX-TEST-VALUE-SHORTFORM",
        "XX-TEST-VALUE-UUID",
        "XX-TEST-VALUE-IDENTIFIER")
    )

    const hl7dispenseNotification = convertDispenseNotification(dispenseNotification)

    medicationDispenses.map((medicationDispense, index) => {
      expect(
        getShortFormIdExtension(
          getFhirGroupIdentifierExtension(medicationDispense)
        ).valueIdentifier.value
      ).toEqual(
        hl7dispenseNotification
          .pertinentInformation1
          .pertinentSupplyHeader
          .pertinentInformation4
          .pertinentPrescriptionID
          .value
          ._attributes
          .extension
      )
      expect(
        getUuidExtension(
          getFhirGroupIdentifierExtension(medicationDispense)
        ).valueIdentifier.value
      ).toEqual(
        hl7dispenseNotification
          .pertinentInformation1
          .pertinentSupplyHeader
          .inFulfillmentOf
          .priorOriginalPrescriptionRef
          .id
          ._attributes
          .root
      )
      expect(
        medicationDispense.authorizingPrescription
          .map(a => a.identifier)
          .filter(identifier =>
            identifier.system === "https://fhir.nhs.uk/Id/prescription-order-item-number"
          )[0]
          .value
      ).toEqual(
        hl7dispenseNotification
          .pertinentInformation1
          .pertinentSupplyHeader
          .pertinentInformation1[index]
          .pertinentSuppliedLineItem
          .inFulfillmentOf
          .priorOriginalItemRef
          .id
          ._attributes
          .root
      )
    })
  })

  // eslint-disable-next-line max-len
  test("quantity maps to pertinentInformation1.pertinentSupplyHeader.pertinentInformation1.pertinentSuppliedLineItem.component.suppliedLineItemQuantity", () => {
    medicationDispenses.forEach(medicationDispense => {
      medicationDispense.quantity.value = "XX-TEST-VALUE"
      medicationDispense.quantity.unit = "XX-TEST-VALUE-UNIT"
      medicationDispense.quantity.code = "XX-TEST-VALUE-CODE"
    })

    const hl7dispenseNotification = convertDispenseNotification(dispenseNotification)

    medicationDispenses.map((medicationDispense, index) => {
      expect(
        medicationDispense.quantity.value
      ).toEqual(
        hl7dispenseNotification
          .pertinentInformation1
          .pertinentSupplyHeader
          .pertinentInformation1[index]
          .pertinentSuppliedLineItem
          .component
          .suppliedLineItemQuantity
          .quantity
          ._attributes
          .value
      )
      expect(
        medicationDispense.quantity.value
      ).toEqual(
        hl7dispenseNotification
          .pertinentInformation1
          .pertinentSupplyHeader
          .pertinentInformation1[index]
          .pertinentSuppliedLineItem
          .component
          .suppliedLineItemQuantity
          .quantity
          .translation
          ._attributes
          .value
      )
      expect(
        medicationDispense.quantity.unit
      ).toEqual(
        hl7dispenseNotification
          .pertinentInformation1
          .pertinentSupplyHeader
          .pertinentInformation1[index]
          .pertinentSuppliedLineItem
          .component
          .suppliedLineItemQuantity
          .quantity
          .translation
          ._attributes
          .displayName
      )
      expect(
        medicationDispense.quantity.unit
      ).toEqual(
        hl7dispenseNotification
          .pertinentInformation1
          .pertinentSupplyHeader
          .pertinentInformation1[index]
          .pertinentSuppliedLineItem
          .component
          .suppliedLineItemQuantity
          .code
          ._attributes
          .displayName
      )
      expect(
        medicationDispense.quantity.code
      ).toEqual(
        hl7dispenseNotification
          .pertinentInformation1
          .pertinentSupplyHeader
          .pertinentInformation1[index]
          .pertinentSuppliedLineItem
          .component
          .suppliedLineItemQuantity
          .code
          ._attributes
          .code
      )
      expect(
        medicationDispense.quantity.code
      ).toEqual(
        hl7dispenseNotification
          .pertinentInformation1
          .pertinentSupplyHeader
          .pertinentInformation1[index]
          .pertinentSuppliedLineItem
          .component
          .suppliedLineItemQuantity
          .quantity
          .translation
          ._attributes.code
      )
    })
  })

  test("whenPrepared maps to pertinentInformation1.pertinentSupplyHeader.author.time", () => {
    medicationDispenses.forEach(medicationDispense => medicationDispense.whenPrepared = "2020-03-10")

    const expected = "20200310000000"

    const hl7dispenseNotification = convertDispenseNotification(dispenseNotification)

    medicationDispenses.map(() => {
      expect(
        expected
      ).toEqual(
        hl7dispenseNotification
          .pertinentInformation1
          .pertinentSupplyHeader
          .author
          .time
          ._attributes
          .value
      )
    })
  })

  // eslint-disable-next-line max-len
  test("dosage maps to pertinentInformation1.pertinentSupplyHeader.pertinentInformation1.pertinentSuppliedLineItem.component.suppliedLineItemQuantity.pertinentInformation1.pertinentSupplyInstructions", () => {
    medicationDispenses.forEach(medicationDispense =>
      medicationDispense.dosageInstruction.forEach(d => d.text = "XX-TEST-VALUE")
    )

    const hl7dispenseNotification = convertDispenseNotification(dispenseNotification)

    medicationDispenses.map((medicationDispense, index) => {
      expect(
        medicationDispense.dosageInstruction[0].text
      ).toEqual(
        hl7dispenseNotification
          .pertinentInformation1
          .pertinentSupplyHeader
          .pertinentInformation1[index]
          .pertinentSuppliedLineItem
          .component
          .suppliedLineItemQuantity
          .pertinentInformation1
          .pertinentSupplyInstructions
          .value
          ._text
      )
    })
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

function setPrescriptionItemNumber(
  medicationDispense: fhir.MedicationDispense,
  newPrescriptionItemNumber: string
): void {
  medicationDispense.identifier
    .forEach(i => {
      if (i.system === "https://fhir.nhs.uk/Id/prescription-dispense-item-number") {
        i.value = newPrescriptionItemNumber
      }
    })
}

function setMedicationCodeableConcept(
  medicationDispense: fhir.MedicationDispense,
  newMedicationCode: string,
  newMedicationDisplay: string
): void {
  medicationDispense.medicationCodeableConcept.coding.forEach(c => {
    c.code = newMedicationCode
    c.display = newMedicationDisplay
  })
}

function setPatientId(
  medicationDispense: fhir.MedicationDispense,
  newPatientId: string
): void {
  medicationDispense.subject.identifier.value = newPatientId
}

function setPractitionerName(
  medicationDispense: fhir.MedicationDispense,
  newPatientId: string
): void {
  medicationDispense
    .performer
    .map(p => p.actor)
    .find(a => a.type === "Practitioner")
    .display = newPatientId
}

function  setAuthorizingPrescriptionValues(
  medicationDispense: fhir.MedicationDispense,
  newShortForm: string,
  newUuid: string,
  newIdentifier: string
): void {
  const groupIdExtension = getFhirGroupIdentifierExtension(medicationDispense)
  const shortFormIdExtension = getShortFormIdExtension(groupIdExtension)
  shortFormIdExtension.valueIdentifier.value = newShortForm
  const uuidExtension = getUuidExtension(groupIdExtension)
  uuidExtension.valueIdentifier.value = newUuid
  medicationDispense.authorizingPrescription.map(a => a.identifier).forEach(i => {
    if (i.system === "https://fhir.nhs.uk/Id/prescription-order-item-number") {
      i.value = newIdentifier
    }
  })
}

function getShortFormIdExtension(
  groupIdExtension: fhir.ExtensionExtension<fhir.Extension>
): fhir.IdentifierExtension {
  return getExtensionForUrl(
    groupIdExtension.extension,
    "shortForm",
    "MedicationDispense.authorizingPrescription.extension.valueIdentifier"
  ) as fhir.IdentifierExtension
}

function getUuidExtension(
  groupIdExtension: fhir.ExtensionExtension<fhir.Extension>
): fhir.IdentifierExtension {
  return getExtensionForUrl(
    groupIdExtension.extension,
    "UUID",
    "MedicationDispense.authorizingPrescription.extension.valueIdentifier"
  ) as fhir.IdentifierExtension
}
