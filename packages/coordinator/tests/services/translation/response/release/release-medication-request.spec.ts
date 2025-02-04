import {
  createCourseOfTherapyType,
  createDispenseRequest,
  createDosage,
  createGroupIdentifierFromPrescriptionIds,
  createMedicationRequestExtensions,
  createNote,
  createSnomedCodeableConcept,
  createMedicationRequest,
  getStatus
} from "../../../../../src/services/translation/response/release/release-medication-request"
import {fhir, hl7V3} from "@models"
import {LosslessNumber} from "lossless-json"

import {toArray} from "../../../../../src/services/translation/common"
import {setSubcaccCertEnvVar} from "../../../../resources/test-helpers"
import {getExamplePrescriptionReleaseResponse} from "../../../../resources/test-resources"
import pino from "pino"

const logger = pino()
describe("extension", () => {
  setSubcaccCertEnvVar("../resources/certificates/NHS_INT_Level1D_Base64_pem.cer")
  const exampleResponsiblePartyId = "responsiblePartyId"
  const examplePrescriptionType = new hl7V3.PrescriptionType(new hl7V3.PrescriptionTypeCode("0101"))
  const examplePrescriptionEndorsement1 = new hl7V3.PrescriptionEndorsement(
    new hl7V3.PrescriptionEndorsementCode("CC")
  )
  const examplePrescriptionEndorsement2 = new hl7V3.PrescriptionEndorsement(
    new hl7V3.PrescriptionEndorsementCode("FS")
  )
  const exampleRepeatNumber = new hl7V3.Interval(new hl7V3.NumericValue("1"), new hl7V3.NumericValue("6"))
  const exampleReviewDate = new hl7V3.ReviewDate(new hl7V3.Timestamp("20210301"))
  const exampleControlledDrugWords = "twenty eight"
  const examplePreviousIssueDate = new hl7V3.PreviousIssueDate(new hl7V3.Timestamp("20210214120802"))

  test("contains responsible practitioner", () => {
    const result = createMedicationRequestExtensions(
      exampleResponsiblePartyId,
      examplePrescriptionType,
      null,
      null,
      [],
      null,
      null
    )
    const expected: fhir.ReferenceExtension<fhir.PractitionerRole> = {
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ResponsiblePractitioner",
      valueReference: {
        reference: "urn:uuid:responsiblePartyId"
      }
    }
    expect(result).toContainEqual(expected)
  })

  test("contains prescription type", () => {
    const result = createMedicationRequestExtensions(
      exampleResponsiblePartyId,
      examplePrescriptionType,
      null,
      null,
      [],
      null,
      null
    )
    const expected: fhir.CodingExtension = {
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType",
      valueCoding: {
        system: "https://fhir.nhs.uk/CodeSystem/prescription-type",
        code: "0101"
      }
    }
    expect(result).toContainEqual(expected)
  })

  test("handles no endorsements", () => {
    const result = createMedicationRequestExtensions(
      exampleResponsiblePartyId,
      examplePrescriptionType,
      null,
      null,
      [],
      null,
      null
    )
    result.forEach(extension => {
      expect(extension.url).not.toEqual("https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionEndorsement")
    })
  })

  test("handles single endorsement", () => {
    const result = createMedicationRequestExtensions(
      exampleResponsiblePartyId,
      examplePrescriptionType,
      null,
      null,
      [examplePrescriptionEndorsement1],
      null,
      null
    )
    const expected: fhir.CodeableConceptExtension = {
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionEndorsement",
      valueCodeableConcept: {
        coding: [{
          code: "CC",
          system: "https://fhir.nhs.uk/CodeSystem/medicationrequest-endorsement"
        }]
      }
    }
    expect(result).toContainEqual(expected)
  })

  test("handles multiple endorsements", () => {
    const result = createMedicationRequestExtensions(
      exampleResponsiblePartyId,
      examplePrescriptionType,
      null,
      null,
      [examplePrescriptionEndorsement1, examplePrescriptionEndorsement2],
      null,
      null
    )
    const expected1: fhir.CodeableConceptExtension = {
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionEndorsement",
      valueCodeableConcept: {
        coding: [{
          code: "CC",
          system: "https://fhir.nhs.uk/CodeSystem/medicationrequest-endorsement"
        }]
      }
    }
    const expected2: fhir.CodeableConceptExtension = {
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionEndorsement",
      valueCodeableConcept: {
        coding: [{
          code: "FS",
          system: "https://fhir.nhs.uk/CodeSystem/medicationrequest-endorsement"
        }]
      }
    }
    expect(result).toContainEqual(expected1)
    expect(result).toContainEqual(expected2)
  })

  test("handles no repeat information", () => {
    const result = createMedicationRequestExtensions(
      exampleResponsiblePartyId,
      examplePrescriptionType,
      null,
      null,
      [],
      null,
      null
    )
    result.forEach(extension => {
      expect(extension.url).not.toEqual(
        "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation"
      )
    })
  })

  test("handles repeat information", () => {
    const result = createMedicationRequestExtensions(
      exampleResponsiblePartyId,
      examplePrescriptionType,
      exampleRepeatNumber,
      exampleReviewDate,
      [],
      null,
      null
    )
    const expected: fhir.UkCoreRepeatInformationExtension = {
      url: "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
      extension: [
        {
          url: "authorisationExpiryDate",
          valueDateTime: "2021-03-01"
        },
        {
          url: "numberOfPrescriptionsIssued",
          valueUnsignedInt: new LosslessNumber("1")
        }
      ]
    }
    expect(result).toContainEqual(expected)
  })

  test("handles review date only", () => {
    const result = createMedicationRequestExtensions(
      exampleResponsiblePartyId,
      examplePrescriptionType,
      null,
      exampleReviewDate,
      [],
      null,
      null
    )
    const expected: fhir.UkCoreRepeatInformationExtension = {
      url: "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
      extension: [
        {
          url: "authorisationExpiryDate",
          valueDateTime: "2021-03-01"
        }
      ]
    }
    expect(result).toContainEqual(expected)
  })

  test("handles low repeat number only", () => {
    const result = createMedicationRequestExtensions(
      exampleResponsiblePartyId,
      examplePrescriptionType,
      new hl7V3.Interval<hl7V3.NumericValue>(new hl7V3.NumericValue("1"), null),
      null,
      [],
      null,
      null
    )
    const expected: fhir.UkCoreRepeatInformationExtension = {
      url: "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
      extension: [
        {
          url: "numberOfPrescriptionsIssued",
          valueUnsignedInt: new LosslessNumber("1")
        }
      ]
    }
    expect(result).toContainEqual(expected)
  })

  test("handles no controlled drug words", () => {
    const result = createMedicationRequestExtensions(
      exampleResponsiblePartyId,
      examplePrescriptionType,
      null,
      null,
      [],
      null,
      null
    )
    result.forEach(extension => {
      expect(extension.url).not.toEqual("https://fhir.nhs.uk/StructureDefinition/Extension-DM-ControlledDrug")
    })
  })

  test("handles controlled drug words", () => {
    const result = createMedicationRequestExtensions(
      exampleResponsiblePartyId,
      examplePrescriptionType,
      null,
      null,
      [],
      exampleControlledDrugWords,
      null
    )
    const expected: fhir.ControlledDrugExtension = {
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ControlledDrug",
      extension: [{
        url: "quantityWords",
        valueString: "twenty eight"
      }]
    }
    expect(result).toContainEqual(expected)
  })

  test("handles no previous issue date", () => {
    const result = createMedicationRequestExtensions(
      exampleResponsiblePartyId,
      examplePrescriptionType,
      null,
      null,
      [],
      null,
      null
    )
    result.forEach(extension => {
      expect(extension.url).not.toEqual("https://fhir.nhs.uk/StructureDefinition/Extension-EPS-DispensingInformation")
    })
  })

  test("handles previous issue date", () => {
    const result = createMedicationRequestExtensions(
      exampleResponsiblePartyId,
      examplePrescriptionType,
      null,
      null,
      [],
      null,
      examplePreviousIssueDate
    )
    const expected: fhir.DispensingInformationExtension = {
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-DispensingInformation",
      extension: [{
        url: "dateLastDispensed",
        valueDateTime: "2021-02-14T12:08:02+00:00"
      }]
    }
    expect(result).toContainEqual(expected)
  })
})

describe("status", () => {
  test("is mapped correctly", () => {
    const itemStatus = new hl7V3.ItemStatus(hl7V3.ItemStatusCode.FULLY_DISPENSED)
    const result = getStatus(itemStatus)
    expect(result).toEqual("completed")
  })

  test("throws for unknown status code", () => {
    const itemStatus = new hl7V3.ItemStatus(new hl7V3.ItemStatusCode("testing"))
    expect(() => getStatus(itemStatus)).toThrow(TypeError)
  })
})

describe("medication", () => {
  const exampleMedicationCode = new hl7V3.SnomedCode("322237000", "Paracetamol 500mg soluble tablets")

  test("is mapped correctly", () => {
    const result = createSnomedCodeableConcept(exampleMedicationCode)
    expect(result).toEqual({
      coding: [{
        system: "http://snomed.info/sct",
        code: "322237000",
        display: "Paracetamol 500mg soluble tablets"
      }]
    })
  })
})

describe("groupIdentifier", () => {
  const examplePrescriptionIds: [hl7V3.GlobalIdentifier, hl7V3.ShortFormPrescriptionIdentifier] = [
    new hl7V3.GlobalIdentifier("B2FC79F0-2793-4736-9B2D-0976C21E73A5"),
    new hl7V3.ShortFormPrescriptionIdentifier("6F5652-Z8866F-11EBAE")
  ]
  test("is mapped correctly", () => {
    const result = createGroupIdentifierFromPrescriptionIds(examplePrescriptionIds)
    expect(result).toEqual({
      extension: [
        {
          url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId",
          valueIdentifier: {
            system: "https://fhir.nhs.uk/Id/prescription",
            value: "b2fc79f0-2793-4736-9b2d-0976c21e73a5"
          }
        }
      ],
      system: "https://fhir.nhs.uk/Id/prescription-order-number",
      value: "6F5652-Z8866F-11EBAE"
    })
  })
})

describe("courseOfTherapyType", () => {
  const treatmentTypeRepeatDispensing = new hl7V3.PrescriptionTreatmentType(
    hl7V3.PrescriptionTreatmentTypeCode.CONTINUOUS_REPEAT_DISPENSING
  )
  const treatmentTypeRepeatPrescribing = new hl7V3.PrescriptionTreatmentType(
    hl7V3.PrescriptionTreatmentTypeCode.CONTINUOUS
  )
  const treatmentTypeAcute = new hl7V3.PrescriptionTreatmentType(
    hl7V3.PrescriptionTreatmentTypeCode.ACUTE
  )
  const exampleRepeatNumber = new hl7V3.Interval(new hl7V3.NumericValue("1"), new hl7V3.NumericValue("6"))

  test("repeat dispensing prescription", () => {
    const result = createCourseOfTherapyType(treatmentTypeRepeatDispensing, exampleRepeatNumber)
    expect(result).toEqual(fhir.COURSE_OF_THERAPY_TYPE_CONTINUOUS_REPEAT_DISPENSING)
  })

  test("repeat prescribing prescription", () => {
    const result = createCourseOfTherapyType(treatmentTypeRepeatPrescribing, exampleRepeatNumber)
    expect(result).toEqual(fhir.COURSE_OF_THERAPY_TYPE_CONTINUOUS)
  })

  test("acute / mixed prescription, repeat prescribing line item", () => {
    const result = createCourseOfTherapyType(treatmentTypeAcute, exampleRepeatNumber)
    expect(result).toEqual(fhir.COURSE_OF_THERAPY_TYPE_CONTINUOUS)
  })

  test("acute / mixed prescription, acute line item", () => {
    const result = createCourseOfTherapyType(treatmentTypeAcute, null)
    expect(result).toEqual(fhir.COURSE_OF_THERAPY_TYPE_ACUTE)
  })
})

describe("note", () => {
  test("handles no additional instructions", () => {
    const result = createNote("")
    expect(result).toBeFalsy()
  })

  test("handles additional instructions", () => {
    const result = createNote("Additional instructions")
    expect(result).toEqual([{
      text: "Additional instructions"
    }])
  })
})

describe("dosage", () => {
  const exampleDosageInstructions = new hl7V3.DosageInstructions("As required")

  test("contains text", () => {
    const result = createDosage(exampleDosageInstructions)
    expect(result.text).toEqual("As required")
  })
})

describe("dispenseRequest", () => {
  const exampleDispensingSitePreference = new hl7V3.DispensingSitePreference(
    new hl7V3.DispensingSitePreferenceCode("P1")
  )
  const exampleQuantity = new hl7V3.QuantityInAlternativeUnits("28", "28", new hl7V3.SnomedCode("732936001", "Tablet"))
  const exampleLineItemQuantity = new hl7V3.LineItemQuantity()
  exampleLineItemQuantity.quantity = exampleQuantity
  const exampleEffectiveTime = new hl7V3.Interval(new hl7V3.Timestamp("20210101"), new hl7V3.Timestamp("20210201"))
  const exampleExpectedUseTime = new hl7V3.IntervalUnanchored("28", "d")

  test("contains dispensing site preference", () => {
    const result = createDispenseRequest(
      exampleDispensingSitePreference,
      exampleLineItemQuantity,
      null,
      null
    )
    expect(result.extension).toContainEqual({
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PerformerSiteType",
      valueCoding: {
        system: "https://fhir.nhs.uk/CodeSystem/dispensing-site-preference",
        code: "P1"
      }
    })
  })

  test("fixes numberOfRepeatsAllowed to 0 in MedicationRequest.dispenseRequest", () => {
    const result = createDispenseRequest(
      exampleDispensingSitePreference,
      exampleLineItemQuantity,
      null,
      null
    )
    expect(result.numberOfRepeatsAllowed).toStrictEqual(new LosslessNumber("0"))
  })

  test("contains quantity", () => {
    const result = createDispenseRequest(
      exampleDispensingSitePreference,
      exampleLineItemQuantity,
      null,
      null
    )
    expect(result.quantity).toEqual({
      code: "732936001",
      system: "http://snomed.info/sct",
      unit: "Tablet",
      value: new LosslessNumber("28")
    })
  })

  test("handles no expected supply duration or validity period", () => {
    const result = createDispenseRequest(
      exampleDispensingSitePreference,
      exampleLineItemQuantity,
      null,
      null
    )
    expect(result.expectedSupplyDuration).toBeFalsy()
    expect(result.validityPeriod).toBeFalsy()
  })

  test("handles validity period", () => {
    const daysSupply = new hl7V3.DaysSupply()
    daysSupply.effectiveTime = exampleEffectiveTime
    const result = createDispenseRequest(
      exampleDispensingSitePreference,
      exampleLineItemQuantity,
      daysSupply,
      null
    )
    expect(result.expectedSupplyDuration).toBeFalsy()
    expect(result.validityPeriod).toEqual({
      start: "2021-01-01",
      end: "2021-02-01"
    })
  })

  test("handles validity period start only", () => {
    const daysSupply = new hl7V3.DaysSupply()
    daysSupply.effectiveTime = {low: new hl7V3.Timestamp("20210101")}
    const result = createDispenseRequest(
      exampleDispensingSitePreference,
      exampleLineItemQuantity,
      daysSupply,
      null
    )
    expect(result.expectedSupplyDuration).toBeFalsy()
    expect(result.validityPeriod).toEqual({
      start: "2021-01-01"
    })
  })

  test("handles validity period end only", () => {
    const daysSupply = new hl7V3.DaysSupply()
    daysSupply.effectiveTime = {high: new hl7V3.Timestamp("20210301")}
    const result = createDispenseRequest(
      exampleDispensingSitePreference,
      exampleLineItemQuantity,
      daysSupply,
      null
    )
    expect(result.expectedSupplyDuration).toBeFalsy()
    expect(result.validityPeriod).toEqual({
      end: "2021-03-01"
    })
  })

  test("handles expected supply duration", () => {
    const daysSupply = new hl7V3.DaysSupply()
    daysSupply.expectedUseTime = exampleExpectedUseTime
    const result = createDispenseRequest(
      exampleDispensingSitePreference,
      exampleLineItemQuantity,
      daysSupply,
      null
    )
    expect(result.expectedSupplyDuration).toEqual({
      code: "d",
      system: "http://unitsofmeasure.org",
      unit: "days",
      value: new LosslessNumber("28")
    })
    expect(result.validityPeriod).toBeFalsy()
  })

  test("handles expected supply duration and validity period", () => {
    const daysSupply = new hl7V3.DaysSupply()
    daysSupply.effectiveTime = exampleEffectiveTime
    daysSupply.expectedUseTime = exampleExpectedUseTime
    const result = createDispenseRequest(
      exampleDispensingSitePreference,
      exampleLineItemQuantity,
      daysSupply,
      null
    )
    expect(result.expectedSupplyDuration).toEqual({
      code: "d",
      system: "http://unitsofmeasure.org",
      unit: "days",
      value: new LosslessNumber("28")
    })
    expect(result.validityPeriod).toEqual({
      start: "2021-01-01",
      end: "2021-02-01"
    })
  })

  test("handles no performer", () => {
    const result = createDispenseRequest(
      exampleDispensingSitePreference,
      exampleLineItemQuantity,
      null,
      null
    )
    expect(result.performer).toBeFalsy()
  })

  test("handles performer", () => {
    const organization = new hl7V3.Organization()
    organization.id = new hl7V3.SdsOrganizationIdentifier("VNE51")
    const performer = new hl7V3.PrescriptionPerformer(new hl7V3.AgentOrganizationSDS(organization))
    const result = createDispenseRequest(
      exampleDispensingSitePreference,
      exampleLineItemQuantity,
      null,
      performer
    )
    expect(result.performer).toEqual({
      identifier: {
        system: "https://fhir.nhs.uk/Id/ods-organization-code",
        value: "VNE51"
      }
    })
  })
})

function getTestPrescriptionAndLineItem(prescriptionType: "acute" | "continuous" | "continuous-repeat") {
  let filePath: string
  switch (prescriptionType) {
    case "acute":
      filePath = "release_success.xml"
      break
    case "continuous":
      filePath = "repeat_prescribing_release_success.xml"
      break
    case "continuous-repeat":
      filePath = "repeat_dispensing_release_success.xml"
      break
  }

  const prescription = toArray(getExamplePrescriptionReleaseResponse(filePath).component)[0]
    .ParentPrescription
    .pertinentInformation1
    .pertinentPrescription
  const lineItem = toArray(prescription.pertinentInformation2)[0].pertinentLineItem

  return {
    prescription,
    lineItem
  }
}

describe("createMedicationRequest", () => {
  describe("acute prescription release", () => {
    const {prescription, lineItem} = getTestPrescriptionAndLineItem("acute")
    const result = createMedicationRequest(
      prescription,
      lineItem,
      "patient-id",
      "requester-id",
      "responsible-party-id",
      logger
    )

    it("should not have a basedOn field", () => {
      expect(result.basedOn).toBeUndefined()
    })

    it("should have intent of order", () => {
      expect(result.intent).toBe("order")
    })

    it("should have course of therapy code of acute", () => {
      expect(result.courseOfTherapyType.coding[0].code).toBe("acute")
    })
  })

  describe("continuous prescription release", () => {
    const {prescription, lineItem} = getTestPrescriptionAndLineItem("continuous")
    const result = createMedicationRequest(
      prescription,
      lineItem,
      "patient-id",
      "requester-id",
      "responsible-party-id",
      logger
    )

    it("should have intent of order", () => {
      expect(result.intent).toBe("order")
    })

    it("should have course of therapy code of continuous", () => {
      expect(result.courseOfTherapyType.coding[0].code).toBe("continuous")
    })

    testBasedOn("0", result)
  })

  describe("continuous repeat dispensing prescription release", () => {
    const {prescription, lineItem} = getTestPrescriptionAndLineItem("continuous-repeat")
    const result = createMedicationRequest(
      prescription,
      lineItem,
      "patient-id",
      "requester-id",
      "responsible-party-id",
      logger
    )

    it("should have intent of reflex order", () => {
      expect(result.intent).toBe("reflex-order")
    })

    it("should have course of therapy code of continuous repeat dispensing", () => {
      expect(result.courseOfTherapyType.coding[0].code).toBe("continuous-repeat-dispensing")
    })

    it("should have dispenseRequest numberOfRepeatsAllowed", () => {
      const actualNumberOfRepeatsAllowed = result.dispenseRequest.numberOfRepeatsAllowed
      const expected = new LosslessNumber("5")
      expect(actualNumberOfRepeatsAllowed).toEqual(expected)
    })

    testBasedOn("5", result)
  })

  function testBasedOn(repeatsAllowed: string, result: fhir.MedicationRequest) {
    it("should have a basedOn field", () => {
      expect(result.basedOn).not.toBeUndefined()
    })

    describe("basedOn.extension:", () => {
      const extension = result.basedOn.map(e => e.extension)[0].find(x => x.extension)

      it("should have Extension-EPS-RepeatInformation url", () => {
        expect(extension.url).toEqual("https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation")
      })

      it("should have numberOfRepeatsAllowed", () => {
        const numberOfRepeatsAllowedExtension = extension.extension.find(e => e.url === "numberOfRepeatsAllowed")
        const expectedExtensions = {
          "url": "numberOfRepeatsAllowed",
          "valueInteger": new LosslessNumber(repeatsAllowed)
        }
        expect(numberOfRepeatsAllowedExtension).toEqual(expectedExtensions)

      })

      it("should have numberOfRepeatsIssued", () => {
        const numberOfRepeatsIssuedExtension = extension.extension.find(e => e.url === "numberOfRepeatsIssued")
        const expectedExtensions = {
          "url": "numberOfRepeatsIssued",
          "valueInteger": new LosslessNumber("0")
        }
        expect(numberOfRepeatsIssuedExtension).toEqual(expectedExtensions)
      })
    })
  }
})
