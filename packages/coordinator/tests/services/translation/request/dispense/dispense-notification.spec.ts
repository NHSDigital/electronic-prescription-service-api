import {
  convertDispenseNotification,
  getPrescriptionItemNumber,
  getPrescriptionStatus
} from "../../../../../src/services/translation/request/dispense/dispense-notification"
import * as TestResources from "../../../../resources/test-resources"
import requireActual = jest.requireActual
import {MomentFormatSpecification, MomentInput} from "moment"
import {hl7V3, fhir} from "@models"
import {getExtensionForUrl, resolveReference, toArray} from "../../../../../src/services/translation/common"
import {clone} from "../../../../resources/test-helpers"
import {
  getContainedMedicationRequestViaReference,
  getContainedPractitionerRoleViaReference,
  getMedicationDispenses,
  getMessageHeader
} from "../../../../../src/services/translation/common/getResourcesOfType"
import {ElementCompact} from "xml-js"
import pino from "pino"
import {OrganisationTypeCode} from "../../../../../src/services/translation/common/organizationTypeCode"

const logger = pino()
const mockCreateAuthorForDispenseNotification = jest.fn()
const mockConvertOrganization = jest.fn()
const mockCreateAgentPersonUsingPractitionerRoleAndOrganization = jest.fn()

const actualMoment = requireActual("moment")
jest.mock("moment", () => ({
  utc: (input?: MomentInput, format?: MomentFormatSpecification) =>
    actualMoment.utc(input || "2020-12-18T12:34:34Z", format)
}))
jest.mock("../../../../../src/services/translation/request/agent-person", () => ({
  createAuthorForDispenseNotification: (pr: fhir.PractitionerRole, org: fhir.Organization, at: string) =>
    mockCreateAuthorForDispenseNotification(pr, org, at),
  convertOrganization: (org: fhir.Organization, tel: fhir.ContactPoint) => mockConvertOrganization(org, tel),
  createAgentPersonUsingPractitionerRoleAndOrganization: (pr: fhir.PractitionerRole, org: fhir.Organization) =>
    mockCreateAgentPersonUsingPractitionerRoleAndOrganization(pr, org)
}))

describe("convertPrescriptionDispense", () => {
  const cases = toArray(TestResources.specification[2]).map((example: TestResources.ExamplePrescription) => [
    example.description,
    example.fhirMessageDispense,

    example.hl7V3MessageDispense.PORX_IN080101SM31.ControlActEvent.subject
      .DispenseNotification as hl7V3.DispenseNotification
  ])

  test.each(cases)("accepts %s", async (_desc: string, input: fhir.Bundle) => {
    expect(() => convertDispenseNotification(input, logger)).not.toThrow()
  })
})

describe("getPrescriptionStatus", () => {
  const cases = [

    [{code: "0001", display: "To be Dispensed"}, createStatusCode("0001", "To be Dispensed")._attributes],
    [{code: "0002", display: "With Dispenser"}, createStatusCode("0002", "With Dispenser")._attributes],
    [
      {code: "0003", display: "With Dispenser - Active"},
      createStatusCode("0003", "With Dispenser - Active")._attributes
    ],
    [{code: "0004", display: "Expired"}, createStatusCode("0004", "Expired")._attributes],
    [{code: "0005", display: "Cancelled"}, createStatusCode("0005", "Cancelled")._attributes],
    [{code: "0006", display: "Dispensed"}, createStatusCode("0006", "Dispensed")._attributes],
    [{code: "0007", display: "Not Dispensed"}, createStatusCode("0007", "Not Dispensed")._attributes]

  ]

  test.each(cases)(
    "when status is %p, getPrescriptionStatus returns prescription status %p",
    (code: fhir.Coding, expected: ElementCompact) => {
      const bundle = clone(TestResources.specification[2].fhirMessageDispense)
      const fhirMedicationDispenses = getMedicationDispenses(bundle)
      expect(fhirMedicationDispenses.length).toBeGreaterThan(0)
      fhirMedicationDispenses.forEach((medicationDispense) => {
        setStatusCode(medicationDispense, code)
        const prescriptionStatus = getPrescriptionStatus(medicationDispense)
        expect(prescriptionStatus.valueCoding.code).toEqual(expected.code)
        expect(prescriptionStatus.valueCoding.display).toEqual(expected.displayName)
      })
    }
  )
})

describe("fhir MessageHeader maps correct values in DispenseNotification", () => {
  let dispenseNotification: fhir.Bundle
  let messageHeader: fhir.MessageHeader
  beforeEach(() => {
    dispenseNotification = clone(TestResources.specification[2].fhirMessageDispense)
    messageHeader = getMessageHeader(dispenseNotification)
  })

  test("replacementOf extension maps to sequelTo.priorMessageRef.id when present", async () => {
    messageHeader.extension = [
      {
        url: "https://fhir.nhs.uk/StructureDefinition/Extension-replacementOf",
        valueIdentifier: {
          system: "TEST-SYSTEM",
          value: "TEST-VALUE"
        }
      }
    ]

    const hl7dispenseNotification = convertDispenseNotification(dispenseNotification, logger)

    expect(hl7dispenseNotification.replacementOf.priorMessageRef.id._attributes.root).toEqual("TEST-VALUE")
  })

  test("replacementOf extension doesn't map to sequelTo.priorMessageRef.id when missing", async () => {
    messageHeader.extension = []

    const hl7dispenseNotification = convertDispenseNotification(dispenseNotification, logger)

    expect(hl7dispenseNotification.replacementOf).toBeUndefined()
  })
  test("response.identifier maps to sequelTo.priorPrescriptionReleaseEventRef.id", async () => {
    messageHeader.response.identifier = "XX-TEST-VALUE"

    const hl7dispenseNotification = convertDispenseNotification(dispenseNotification, logger)

    expect(hl7dispenseNotification.sequelTo.priorPrescriptionReleaseEventRef.id._attributes.root).toEqual(
      messageHeader.response.identifier
    )
  })
})

describe("fhir eRD MedicationDispense maps correct values in DispenseNotification", () => {
  let dispenseNotification: fhir.Bundle
  let hl7dispenseNotification: hl7V3.DispenseNotification
  const testFilePath = "../../tests/resources/test-data/fhir/dispensing/Process-Request-Dispense-eRD.json"
  beforeEach(() => {
    dispenseNotification = TestResources.getBundleFromTestFile(testFilePath)
    hl7dispenseNotification = convertDispenseNotification(dispenseNotification, logger)
  })

  test("numberOfRepeatsIssued maps correctly to pertinentSupplyHeader.repeatNumber.low", () => {
    expect(hl7dispenseNotification.pertinentInformation1.pertinentSupplyHeader.repeatNumber.low).toEqual(
      new hl7V3.NumericValue("1")
    )
  })

  test("numberOfRepeatsAllowed maps correctly to pertinentSupplyHeader.repeatNumber.high", () => {
    expect(hl7dispenseNotification.pertinentInformation1.pertinentSupplyHeader.repeatNumber.high).toEqual(
      new hl7V3.NumericValue("5")
    )
  })

  test("numberOfPrescriptionsIssued maps correctly to pertinentSuppliedLineItem.repeatNumber.low", () => {
    expect(
      hl7dispenseNotification.pertinentInformation1.pertinentSupplyHeader.pertinentInformation1[0]
        .pertinentSuppliedLineItem.repeatNumber.low
    ).toEqual(new hl7V3.NumericValue("1"))
  })

  test("dispenseRequest.numberOfRepeatsAllowed maps correctly to pertinentSuppliedLineItem.repeatNumber.high", () => {
    expect(
      hl7dispenseNotification.pertinentInformation1.pertinentSupplyHeader.pertinentInformation1[0]
        .pertinentSuppliedLineItem.repeatNumber.high
    ).toEqual(new hl7V3.NumericValue("6"))
  })
})

describe("fhir acute with review date maps correct values in DispenseNotification", () => {
  let dispenseNotification: fhir.Bundle
  let hl7dispenseNotification: hl7V3.DispenseNotification
  const testFilePath =
    "../../tests/resources/test-data/fhir/dispensing/Process-Request-Dispense-Notifications-acute-with-review-date.json"
  beforeEach(() => {
    dispenseNotification = TestResources.getBundleFromTestFile(testFilePath)
    hl7dispenseNotification = convertDispenseNotification(dispenseNotification, logger)
  })

  test("pertinentSupplyHeader.repeatNumber is not populated", () => {
    expect(hl7dispenseNotification.pertinentInformation1.pertinentSupplyHeader.repeatNumber).toBeFalsy()
  })

  test("pertinentSuppliedLineItem.repeatNumber is not populated", () => {
    expect(
      hl7dispenseNotification.pertinentInformation1.pertinentSupplyHeader.pertinentInformation1[0]
        .pertinentSuppliedLineItem.repeatNumber
    ).toBeFalsy()
  })
})

describe("fhir MedicationDispense maps correct values in DispenseNotification when prescription not dispensed", () => {
  let dispenseNotification: fhir.Bundle
  let hl7dispenseNotification: hl7V3.DispenseNotification
  const testFileDir = "../../tests/resources/test-data/fhir/dispensing/"

  test("no pertinentInformation2 present when no NotDispensed statuses", () => {
    const testFileName = "Process-Request-Dispense-Not-Dispensed-No-Reasons.json"
    dispenseNotification = TestResources.getBundleFromTestFile(testFileDir + testFileName)
    hl7dispenseNotification = convertDispenseNotification(dispenseNotification, logger)
    expect(hl7dispenseNotification.pertinentInformation1.pertinentSupplyHeader.pertinentInformation2).toEqual(undefined)
  })

  test("pertinentInformation2 present when Dispensed with statusReasonCodeableConcept", () => {
    const testFileName = "Process-Request-Dispense-Notifications.json"
    dispenseNotification = TestResources.getBundleFromTestFile(testFileDir + testFileName)
    hl7dispenseNotification = convertDispenseNotification(dispenseNotification, logger)
    const pertinentInformation2NonDispensing = hl7dispenseNotification.pertinentInformation1.pertinentSupplyHeader
      .pertinentInformation1[0].pertinentSuppliedLineItem
      .pertinentInformation2 as hl7V3.PertinentInformation2NonDispensing
    expect(pertinentInformation2NonDispensing.pertinentNonDispensingReason).toEqual(
      new hl7V3.NonDispensingReason("0001", "Not required as instructed by the patient")
    )
  })

  test("no pertinentInformation2 present when Item fully dispensed", () => {
    const testFileName = "Process-Request-Dispense-Notifications.json"
    dispenseNotification = TestResources.getBundleFromTestFile(testFileDir + testFileName)
    hl7dispenseNotification = convertDispenseNotification(dispenseNotification, logger)
    expect(
      hl7dispenseNotification.pertinentInformation1.pertinentSupplyHeader.pertinentInformation1[1]
        .pertinentSuppliedLineItem.pertinentInformation2
    ).toEqual(undefined)
  })

  test("prescriptionNonDispensingReason maps correctly to NonDispensingReason", () => {
    const testFileName = "Process-Request-Dispense-Not-Dispensed-Expired.json"
    dispenseNotification = TestResources.getBundleFromTestFile(testFileDir + testFileName)
    hl7dispenseNotification = convertDispenseNotification(dispenseNotification, logger)
    expect(
      hl7dispenseNotification.pertinentInformation1.pertinentSupplyHeader.pertinentInformation2
        .pertinentNonDispensingReason
    ).toEqual(new hl7V3.NonDispensingReason("0008", "Item or prescription expired"))
  })

  test("inconsistent prescriptionNonDispensingReasons result in error", () => {
    const testFileName = "Process-Request-Dispense-Not-Dispensed-Inconsistent.json"
    dispenseNotification = TestResources.getBundleFromTestFile(testFileDir + testFileName)
    try {
      convertDispenseNotification(dispenseNotification, logger)
    } catch (e) {
      expect(e.userErrorCode).toEqual("INVALID_VALUE")
      expect(e.userErrorMessage).toEqual(
        // eslint-disable-next-line max-len
        "Expected all MedicationDispenses to have the same value for MedicationDispense.extension:prescriptionNonDispensingReason"
      )
      expect(e.userErrorFhirPath).toEqual("MedicationDispense.extension:prescriptionNonDispensingReason")
    }
  })
})

describe("fhir MedicationDispense throws error for DispenseNotification", () => {
  let dispenseNotification: fhir.Bundle
  const testFileDir = "../../tests/resources/test-data/fhir/dispensing/"

  test("missing extension for reimbursement authority", () => {
    const testFileName = "Process-Request-Dispense-Notifications-No-Extension-for-ReimbursementAuthority.json"
    dispenseNotification = TestResources.getBundleFromTestFile(testFileDir + testFileName)
    expect(() => {
      convertDispenseNotification(dispenseNotification, logger)
    }).toThrow(
      "The dispense notification is missing the reimbursement authority and it should be provided."
    )
  })

  test("missing ODS code for reimbursement authority", () => {
    const testFileName = "Process-Request-Dispense-Notifications-No-ODS-Code-Extension-for-ReimbursementAuthority.json"
    dispenseNotification = TestResources.getBundleFromTestFile(testFileDir + testFileName)
    expect(() => {
      convertDispenseNotification(dispenseNotification, logger)
    }).toThrow(
      "The dispense notification is missing the ODS code for the reimbursement authority and it should be provided."
    )
  })
})

describe("fhir MedicationDispense maps correct values in DispenseNotification", () => {
  const mockAuthorResponse = new hl7V3.PrescriptionAuthor()
  mockCreateAuthorForDispenseNotification.mockReturnValue(mockAuthorResponse)

  const mockConvertOrganizationResponse = new hl7V3.Organization()
  mockConvertOrganization.mockReturnValue(mockConvertOrganizationResponse)

  let dispenseNotification: fhir.Bundle
  let medicationDispenses: Array<fhir.MedicationDispense>
  beforeEach(() => {
    dispenseNotification = clone(TestResources.specification[2].fhirMessageDispense)
    medicationDispenses = getMedicationDispenses(dispenseNotification)
    expect(medicationDispenses.length).toBeGreaterThan(0)
  })

  // eslint-disable-next-line max-len
  test("practitionerRole.organisation.extension maps to primaryInformationRecipient.AgentOrg.agentOrganization", async () => {
    medicationDispenses.forEach((medicationDispense) =>
      setOrganisation(medicationDispense, "urn:uuid:2bf9f37c-d88b-4f86-ad5f-373c1416e04b")
    )

    const hl7dispenseNotification = convertDispenseNotification(dispenseNotification, logger)

    expect(
      hl7dispenseNotification.primaryInformationRecipient.AgentOrg.agentOrganization.id._attributes.extension
    ).toBe("T1450")

    expect(hl7dispenseNotification.primaryInformationRecipient.AgentOrg.agentOrganization.code._attributes.code).toBe(
      OrganisationTypeCode.NOT_SPECIFIED
    )
  })

  test("when Organisation is not a reference an error is thrown", async () => {
    expect(() => {
      medicationDispenses.forEach((medicationDispense) =>
        setInvalidOrganisation(medicationDispense, "xxxxxxx")
      )
      convertDispenseNotification(dispenseNotification, logger)
    }).toThrow("fhirContainedPractitionerRole.organization should be a Reference")
  })

  // eslint-disable-next-line max-len
  test("identifier.value maps to pertinentInformation1.pertinentSupplyHeader.pertinentInformation1.pertinentSuppliedLineItem.id", async () => {
    medicationDispenses.forEach((medicationDispense) => setPrescriptionItemNumber(medicationDispense, "XX-TEST-VALUE"))

    const hl7dispenseNotification = convertDispenseNotification(dispenseNotification, logger)

    const supplyHeaderPertinentInformations =
      hl7dispenseNotification.pertinentInformation1.pertinentSupplyHeader.pertinentInformation1
    expect(supplyHeaderPertinentInformations.length).toEqual(medicationDispenses.length - 1)

    supplyHeaderPertinentInformations.forEach((pertinentInformation, index) => {
      expect(pertinentInformation.pertinentSuppliedLineItem.id._attributes.root).toEqual(
        getPrescriptionItemNumber(medicationDispenses[index])
      )
    })
  })

  // eslint-disable-next-line max-len
  test("medicationCodeableConcept.coding maps to pertinentInformation1.pertinentSupplyHeader.pertinentInformation1.pertinentSuppliedLineItem.component.suppliedLineItemQuantity.product.suppliedManufacturedProduct.manufacturedSuppliedMaterial.code", async () => {
    medicationDispenses.forEach((medicationDispense) =>
      setMedicationCodeableConcept(medicationDispense, "XX-TEST-VALUE", "XX-TEST-VALUE-DISPLAY")
    )

    const hl7dispenseNotification = convertDispenseNotification(dispenseNotification, logger)

    const supplyHeaderPertinentInformations =
      hl7dispenseNotification.pertinentInformation1.pertinentSupplyHeader.pertinentInformation1
    expect(supplyHeaderPertinentInformations.length).toEqual(medicationDispenses.length - 1)

    supplyHeaderPertinentInformations.forEach((pertinentInformation) => {
      const attributes =
        pertinentInformation.pertinentSuppliedLineItem.component[0].suppliedLineItemQuantity.product
          .suppliedManufacturedProduct.manufacturedSuppliedMaterial.code._attributes

      expect(attributes.code).toEqual("XX-TEST-VALUE")
      expect(attributes.displayName).toEqual("XX-TEST-VALUE-DISPLAY")
    })
  })

  test("subject.Patient.value maps to recordTarget.patient.id.extension", async () => {
    medicationDispenses.forEach((medicationDispense) => setPatientId(medicationDispense, "XX-TEST-VALUE"))

    const hl7dispenseNotification = convertDispenseNotification(dispenseNotification, logger)

    medicationDispenses.forEach((medicationDispense) => {
      expect(hl7dispenseNotification.recordTarget.patient.id._attributes.extension).toEqual(
        medicationDispense.subject.identifier.value
      )
    })
  })

  test("authorizingPrescription maps to pertinentInformation1.pertinentSupplyHeader", async () => {
    medicationDispenses.forEach((medicationDispense, index) => {
      setAuthorizingPrescriptionValues(
        medicationDispense,
        `XX-TEST-VALUE-SHORTFORM`,
        `XX-TEST-VALUE-UUID`,
        `XX-TEST-VALUE-IDENTIFIER-${index}`
      )
      const hl7dispenseNotification = convertDispenseNotification(dispenseNotification, logger)
      const fhirContainedMedicationRequest = getContainedMedicationRequestViaReference(
        medicationDispense,
        medicationDispense.authorizingPrescription[0].reference
      )
      expect(
        hl7dispenseNotification.pertinentInformation1.pertinentSupplyHeader.pertinentInformation4
          .pertinentPrescriptionID.value._attributes.extension
      ).toEqual(fhirContainedMedicationRequest.groupIdentifier.value)
      expect(
        hl7dispenseNotification.pertinentInformation1.pertinentSupplyHeader.inFulfillmentOf.priorOriginalPrescriptionRef
          .id._attributes.root
      ).toEqual(getAuthorizingPrescriptionUUIDExtension(medicationDispense).valueIdentifier.value)
      expect(
        hl7dispenseNotification.pertinentInformation1.pertinentSupplyHeader.pertinentInformation1[index]
          .pertinentSuppliedLineItem.inFulfillmentOf.priorOriginalItemRef.id._attributes.root
      ).toEqual(
        fhirContainedMedicationRequest.identifier.filter(
          (identifier) => identifier.system === "https://fhir.nhs.uk/Id/prescription-order-item-number"
        )[0].value
      )
    })
  })

  // eslint-disable-next-line max-len
  test("quantity maps to pertinentInformation1.pertinentSupplyHeader.pertinentInformation1.pertinentSuppliedLineItem.component.suppliedLineItemQuantity", async () => {
    medicationDispenses.forEach((medicationDispense) => {
      medicationDispense.quantity.value = "XX-TEST-VALUE"
      medicationDispense.quantity.unit = "XX-TEST-VALUE-UNIT"
      medicationDispense.quantity.code = "XX-TEST-VALUE-CODE"
    })

    const hl7dispenseNotification = convertDispenseNotification(dispenseNotification, logger)

    const supplyHeaderPertinentInformations =
      hl7dispenseNotification.pertinentInformation1.pertinentSupplyHeader.pertinentInformation1
    expect(supplyHeaderPertinentInformations.length).toEqual(medicationDispenses.length - 1)

    supplyHeaderPertinentInformations.forEach((pertinentInformation, index) => {
      const medicationDispense = medicationDispenses[index]
      const quantity = pertinentInformation.pertinentSuppliedLineItem.component[0].suppliedLineItemQuantity.quantity

      expect(quantity._attributes.value).toEqual(medicationDispense.quantity.value)
      expect(quantity.translation._attributes.value).toEqual(medicationDispense.quantity.value)
      expect(quantity.translation._attributes.displayName).toEqual(medicationDispense.quantity.unit)
      expect(quantity.translation._attributes.code).toEqual(medicationDispense.quantity.code)
    })
  })

  test("pertinentInformation1.pertinentSupplyHeader.author.time is populated using the correct values", async () => {
    medicationDispenses.forEach((medicationDispense) => (medicationDispense.whenHandedOver = "2020-12-18"))

    const hl7dispenseNotification = convertDispenseNotification(dispenseNotification, logger)

    medicationDispenses.forEach((medicationDispense) => {
      const fhirPractitionerRole = getContainedPractitionerRoleViaReference(
        medicationDispense,
        medicationDispense.performer[0].actor.reference
      )
      const fhirOrganisationRef = fhirPractitionerRole.organization as fhir.Reference<fhir.Organization>
      const fhirOrganisation = resolveReference(dispenseNotification, fhirOrganisationRef)

      expect(mockCreateAuthorForDispenseNotification).toBeCalledWith(
        fhirPractitionerRole,
        fhirOrganisation,
        "2020-12-18T12:34:34+00:00" // mocked moment.utc value
      )

      expect(hl7dispenseNotification.pertinentInformation1.pertinentSupplyHeader.author).toEqual(mockAuthorResponse)
    })
  })

  test("pertinentInformation1.pertinentSupplyHeader.author is of the PrescriptionAuthor ", async () => {
    const mockCreateAuthorForDispenseNotificationResponse = new hl7V3.PrescriptionAuthor()
    mockCreateAuthorForDispenseNotification.mockReturnValue(mockCreateAuthorForDispenseNotificationResponse)

    const hl7dispenseNotification = convertDispenseNotification(dispenseNotification, logger)

    expect(hl7dispenseNotification.pertinentInformation1.pertinentSupplyHeader.author).toStrictEqual(
      mockCreateAuthorForDispenseNotificationResponse
    )
  })

  // eslint-disable-next-line max-len
  test("dosage maps to pertinentInformation1.pertinentSupplyHeader.pertinentInformation1.pertinentSuppliedLineItem.component.suppliedLineItemQuantity.pertinentInformation1.pertinentSupplyInstructions", async () => {
    medicationDispenses.forEach((medicationDispense) =>
      medicationDispense.dosageInstruction.forEach((d) => (d.text = "XX-TEST-VALUE"))
    )

    const hl7dispenseNotification = convertDispenseNotification(dispenseNotification, logger)

    const supplyHeaderPertinentInformations =
      hl7dispenseNotification.pertinentInformation1.pertinentSupplyHeader.pertinentInformation1
    expect(supplyHeaderPertinentInformations.length).toEqual(medicationDispenses.length - 1)

    supplyHeaderPertinentInformations.forEach((pertinentInformation, index) => {
      expect(
        pertinentInformation.pertinentSuppliedLineItem.component[0].suppliedLineItemQuantity.pertinentInformation1
          .pertinentSupplyInstructions.value._text
      ).toEqual(medicationDispenses[index].dosageInstruction[0].text)
    })
  })
})

describe("Multiple MedicationRequests for one prescribed item", () => {
  let dispenseNotification: fhir.Bundle
  let hl7v3DispenseNotification: hl7V3.DispenseNotification
  beforeEach(() => {
    const testFileDir = "../../tests/resources/test-data/fhir/dispensing/"
    const testFileName = "Process-Request-Dispense-Multiple-Brands.json"
    dispenseNotification = TestResources.getBundleFromTestFile(testFileDir + testFileName)
    hl7v3DispenseNotification = convertDispenseNotification(dispenseNotification, logger)
  })

  test("multiple MedicationRequests for same prescribed item does not result in additional SuppliedLineItems", () => {
    expect(hl7v3DispenseNotification.pertinentInformation1.pertinentSupplyHeader.pertinentInformation1.length).toEqual(
      2
    )
  })

  // eslint-disable-next-line max-len
  test("multiple MedicationRequests for same prescribed item each map to a SuppliedLineItemQuantity under one SuppliedLineItem", () => {
    const identifier = "473102c6-f591-459a-ac38-e5e2fc641f5a"
    const paracetamolPertinentInformations =
      hl7v3DispenseNotification.pertinentInformation1.pertinentSupplyHeader.pertinentInformation1.filter(
        (p) =>
          p.pertinentSuppliedLineItem.inFulfillmentOf.priorOriginalItemRef.id._attributes.root ===
          identifier.toUpperCase()
      )

    expect(paracetamolPertinentInformations.length).toEqual(1)

    const paracetamolPertinentInformation = paracetamolPertinentInformations[0]
    const paracetamolBrandCodes = ["1858411000001101", "23487311000001100"]
    for (const code of paracetamolBrandCodes) {
      expect(
        paracetamolPertinentInformation.pertinentSuppliedLineItem.component.filter(
          (c) =>
            c.suppliedLineItemQuantity.product.suppliedManufacturedProduct.manufacturedSuppliedMaterial.code._attributes
              .code === code
        ).length
      ).toEqual(1)
    }
  })

  test("correct component1 still exists on single SuppliedLineItem with two SuppliedLineItemQuantity", () => {
    const identifier = "473102c6-f591-459a-ac38-e5e2fc641f5a"
    const paracetamolPertinentInformation =
      hl7v3DispenseNotification.pertinentInformation1.pertinentSupplyHeader.pertinentInformation1.filter(
        (p) =>
          p.pertinentSuppliedLineItem.inFulfillmentOf.priorOriginalItemRef.id._attributes.root ===
          identifier.toUpperCase()
      )[0]

    const expected = new hl7V3.QuantityInAlternativeUnits("60", "60", new hl7V3.SnomedCode("428673006"))
    expected.translation._attributes.displayName = "tablet"

    expect(paracetamolPertinentInformation.pertinentSuppliedLineItem.component1.supplyRequest.quantity).toEqual(
      expected
    )
  })
})

describe("FHIR MedicationDispense has statusReasonCodeableConcept then HL7V conversion", () => {
  let dispenseNotification: fhir.Bundle
  let statusReasonCodeableConcepts: Array<fhir.CodeableConcept>
  let statusReasonCodeableConceptCodes: Array<fhir.Coding>

  beforeAll(() => {
    const dispenseNotificationGenerator = new TestResources.DispenseExampleLoader()
    dispenseNotification = dispenseNotificationGenerator.getfhirMessageNotToBeDispensed("/test-data/fhir/dispensing")
    const medicationDispenses: Array<fhir.MedicationDispense> = getMedicationDispenses(dispenseNotification)
    statusReasonCodeableConcepts = medicationDispenses.flatMap((m) => m.statusReasonCodeableConcept)
    statusReasonCodeableConceptCodes = statusReasonCodeableConcepts.flatMap((s) => s.coding)
  })

  test("should have PertinentInformation2.pertinentNonDispensingReason property on SuppliedLineItem", () => {
    const hl7v3DispenseNotification = convertDispenseNotification(dispenseNotification, logger)
    const pertinentNonDispensingReason = getPertinentNonDispensingReason(hl7v3DispenseNotification)
    expect(pertinentNonDispensingReason).toBeInstanceOf(hl7V3.NonDispensingReason)
  })

  test("should have pertinentNonDispensingReason with classcode value of OBS", () => {
    const hl7v3DispenseNotification = convertDispenseNotification(dispenseNotification, logger)
    const {classCode} = getPertinentInformationNonDispensingReasonAttributes(hl7v3DispenseNotification)
    expect(classCode).toBe("OBS")
  })

  test("should have pertinentNonDispensingReason with moodcode value of EVN", () => {
    const hl7v3DispenseNotification = convertDispenseNotification(dispenseNotification, logger)
    const {moodCode} = getPertinentInformationNonDispensingReasonAttributes(hl7v3DispenseNotification)
    expect(moodCode).toBe("EVN")
  })

  test("should have pertinentNonDispensingReason with code of type PrescriptionAnnotationCode", () => {
    const hl7v3DispenseNotification = convertDispenseNotification(dispenseNotification, logger)
    const nonDispensingReasonCode = getNonDispensingReasonCode(hl7v3DispenseNotification)
    expect(nonDispensingReasonCode).toBeInstanceOf(hl7V3.PrescriptionAnnotationCode)
  })

  test("should have nonDispensingReason with code of value NDR", () => {
    const hl7v3DispenseNotification = convertDispenseNotification(dispenseNotification, logger)
    const nonDispensingReasonCode = getNonDispensingReasonCode(hl7v3DispenseNotification)._attributes.code
    expect(nonDispensingReasonCode).toEqual("NDR")
  })

  test("code.codeSystem should be OID Prescription Annotation Vocab ", () => {
    const hl7v3DispenseNotification = convertDispenseNotification(dispenseNotification, logger)
    const nonDispensingReasonCode = getNonDispensingReasonCode(hl7v3DispenseNotification)
    const codeSystem = nonDispensingReasonCode._attributes.codeSystem
    expect(codeSystem).toEqual("2.16.840.1.113883.2.1.3.2.4.17.30")
  })

  test("statusReasonCodeableConcept.code convert to NonDispensingReason.value.code", () => {
    const hl7v3DispenseNotification = convertDispenseNotification(dispenseNotification, logger)
    statusReasonCodeableConceptCodes.forEach((c, i) => {
      const pertinentNonDispensingReason = getPertinentNonDispensingReason(hl7v3DispenseNotification, i)
      const nonDispensingReasonValueCode = pertinentNonDispensingReason.value._attributes.code
      expect(nonDispensingReasonValueCode).toEqual(c.code)
    })
  })
})

function getNonDispensingReasonCode(
  hl7v3DispenseNotification: hl7V3.DispenseNotification
): hl7V3.PrescriptionAnnotationCode {
  const pertinentNonDispensingReason = getPertinentNonDispensingReason(hl7v3DispenseNotification)
  return pertinentNonDispensingReason.code
}

function getPertinentNonDispensingReason(
  hl7v3DispenseNotification: hl7V3.DispenseNotification,
  suppliedLineItemIndex?: number
): hl7V3.NonDispensingReason {
  const dispenseNotificationSuppliedLineItem = getNonDispensingReasonSuppliedItem(
    hl7v3DispenseNotification,
    suppliedLineItemIndex ? suppliedLineItemIndex : 0
  )
  const {pertinentNonDispensingReason: pertinentNonDispensingReason} = getPertinentInformation2NonDispensing(
    dispenseNotificationSuppliedLineItem
  )
  return pertinentNonDispensingReason
}

function getPertinentInformationNonDispensingReasonAttributes(
  dispenseNotification: hl7V3.DispenseNotification
): hl7V3.AttributeClassCode & hl7V3.AttributeMoodCode {
  const nonDispensingReasonPertinentInformation = getPertinentNonDispensingReason(dispenseNotification)
  return nonDispensingReasonPertinentInformation._attributes
}

function getPertinentInformation2NonDispensing(
  pertinentInformation2Parent: hl7V3.DispenseNotificationSuppliedLineItem
): hl7V3.PertinentInformation2NonDispensing {
  return pertinentInformation2Parent.pertinentInformation2 as hl7V3.PertinentInformation2NonDispensing
}

function getNonDispensingReasonSuppliedItem(
  hl7v3DispenseNotification: hl7V3.DispenseNotification,
  pertinentInformation1Index: number
): hl7V3.DispenseNotificationSuppliedLineItem {
  return hl7v3DispenseNotification.pertinentInformation1.pertinentSupplyHeader.pertinentInformation1[
    pertinentInformation1Index
  ].pertinentSuppliedLineItem
}

function createStatusCode(code: string, display: string): hl7V3.PrescriptionStatusCode {
  const statusCode = new hl7V3.PrescriptionStatusCode(code)
  statusCode._attributes.displayName = display
  return statusCode
}

function setStatusCode(medicationDispense: fhir.MedicationDispense, newStatusCoding: fhir.Coding): void {
  const prescriptionStatus = getPrescriptionStatus(medicationDispense)
  prescriptionStatus.valueCoding.code = newStatusCoding.code
  prescriptionStatus.valueCoding.display = newStatusCoding.display
}

function setPrescriptionItemNumber(
  medicationDispense: fhir.MedicationDispense,
  newPrescriptionItemNumber: string
): void {
  medicationDispense.identifier.forEach((i) => {
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
  medicationDispense.medicationCodeableConcept.coding.forEach((c) => {
    c.code = newMedicationCode
    c.display = newMedicationDisplay
  })
}

function setOrganisation(medicationDispense: fhir.MedicationDispense, newOrganisationRef: string): void {
  const orgRef = getContainedPractitionerRoleViaReference(
    medicationDispense,
    medicationDispense.performer[0].actor.reference
  ).organization as fhir.Reference<fhir.Organization>
  orgRef.reference = newOrganisationRef
}

function setInvalidOrganisation(medicationDispense: fhir.MedicationDispense, newOrganisationRef: string): void {
  const orgRef = getContainedPractitionerRoleViaReference(
    medicationDispense,
    medicationDispense.performer[0].actor.reference
  )
  orgRef.organization = {identifier: {value: newOrganisationRef}}
}

function setPatientId(medicationDispense: fhir.MedicationDispense, newPatientId: string): void {
  medicationDispense.subject.identifier.value = newPatientId
}

function setAuthorizingPrescriptionValues(
  medicationDispense: fhir.MedicationDispense,
  newShortForm: string,
  newUuid: string,
  newIdentifier: string
): void {
  const uuidExtension = getAuthorizingPrescriptionUUIDExtension(medicationDispense)
  uuidExtension.valueIdentifier.value = newUuid
  const fhirContainedMedicationRequest = getContainedMedicationRequestViaReference(
    medicationDispense,
    medicationDispense.authorizingPrescription[0].reference
  )
  fhirContainedMedicationRequest.groupIdentifier.value = newShortForm

  fhirContainedMedicationRequest.identifier.forEach((i) => {
    if (i.system === "https://fhir.nhs.uk/Id/prescription-order-item-number") {
      i.value = newIdentifier
    }
  })
}

function getAuthorizingPrescriptionUUIDExtension(medicationDispense: fhir.MedicationDispense) {
  const fhirContainedMedicationRequest = getContainedMedicationRequestViaReference(
    medicationDispense,
    medicationDispense.authorizingPrescription[0].reference
  )
  return getExtensionForUrl(
    fhirContainedMedicationRequest.groupIdentifier.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId",
    "MedicationDispense.contained[0].groupIdentifier.extension.valueIdentifier"
  ) as fhir.IdentifierExtension
}
