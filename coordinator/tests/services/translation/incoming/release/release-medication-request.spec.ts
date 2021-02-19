import {
  COURSE_OF_THERAPY_TYPE,
  createCourseOfTherapyType,
  createDispenseRequest,
  createDosage,
  createGroupIdentifierFromPrescriptionIds,
  createMedicationRequestExtensions,
  createSnomedCodeableConcept,
  getStatus
} from "../../../../../src/services/translation/incoming/release/release-medication-request"
import * as prescriptions from "../../../../../src/models/hl7-v3/hl7-v3-prescriptions"
import * as codes from "../../../../../src/models/hl7-v3/hl7-v3-datatypes-codes"
import * as fhir from "../../../../../../tests/e2e/pact/models/fhir/fhir-resources"
import * as core from "../../../../../src/models/hl7-v3/hl7-v3-datatypes-core"
import {AgentOrganization, Organization} from "../../../../../src/models/hl7-v3/hl7-v3-people-places"

describe("extension", () => {
  const exampleResponsiblePartyId = "responsiblePartyId"
  const examplePrescriptionType = new prescriptions.PrescriptionType(new codes.PrescriptionTypeCode("0101"))
  const examplePrescriptionEndorsement1 = new prescriptions.PrescriptionEndorsement(
    new codes.PrescriptionEndorsementCode("CC")
  )
  const examplePrescriptionEndorsement2 = new prescriptions.PrescriptionEndorsement(
    new codes.PrescriptionEndorsementCode("FS")
  )
  const exampleRepeatNumber = new core.Interval(new core.NumericValue("1"), new core.NumericValue("6"))
  const exampleReviewDate = new prescriptions.ReviewDate(new core.Timestamp("20210301"))
  const exampleControlledDrugWords = "twenty eight"

  test("contains responsible practitioner", () => {
    const result = createMedicationRequestExtensions(
      exampleResponsiblePartyId,
      examplePrescriptionType,
      null,
      null,
      [],
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
      null
    )
    result.forEach(extension => {
      expect(extension.url).not.toEqual("https://fhir.nhs.uk/StructureDefinition/Extension-PrescriptionEndorsement")
    })
  })

  test("handles single endorsement", () => {
    const result = createMedicationRequestExtensions(
      exampleResponsiblePartyId,
      examplePrescriptionType,
      null,
      null,
      [examplePrescriptionEndorsement1],
      null
    )
    const expected: fhir.CodeableConceptExtension = {
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-PrescriptionEndorsement",
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
      null
    )
    const expected1: fhir.CodeableConceptExtension = {
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-PrescriptionEndorsement",
      valueCodeableConcept: {
        coding: [{
          code: "CC",
          system: "https://fhir.nhs.uk/CodeSystem/medicationrequest-endorsement"
        }]
      }
    }
    const expected2: fhir.CodeableConceptExtension = {
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-PrescriptionEndorsement",
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
      null
    )
    const expected: fhir.RepeatInformationExtension = {
      url: "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
      extension: [
        {
          url: "authorisationExpiryDate",
          valueDateTime: "2021-03-01"
        },
        {
          url: "numberOfRepeatPrescriptionsIssued",
          valueUnsignedInt: "1"
        },
        {
          url: "numberOfRepeatPrescriptionsAllowed",
          valueUnsignedInt: "6"
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
      exampleControlledDrugWords
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
})

describe("status", () => {
  test("is mapped correctly", () => {
    const itemStatus = new prescriptions.ItemStatus("0001")
    const result = getStatus(itemStatus)
    expect(result).toEqual("completed")
  })

  test("throws for unknown status code", () => {
    const itemStatus = new prescriptions.ItemStatus("testing")
    expect(() => getStatus(itemStatus)).toThrow(TypeError)
  })
})

describe("medication", () => {
  const exampleMedicationCode = new codes.SnomedCode("322237000", "Paracetamol 500mg soluble tablets")

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
  const examplePrescriptionIds: [codes.GlobalIdentifier, codes.ShortFormPrescriptionIdentifier] = [
    new codes.GlobalIdentifier("B2FC79F0-2793-4736-9B2D-0976C21E73A5"),
    new codes.ShortFormPrescriptionIdentifier("6F5652-Z8866F-11EBAE")
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
  const treatmentTypeRepeatDispensing = new prescriptions.PrescriptionTreatmentType(
    codes.PrescriptionTreatmentTypeCode.CONTINUOUS_REPEAT_DISPENSING
  )
  const treatmentTypeRepeatPrescribing = new prescriptions.PrescriptionTreatmentType(
    codes.PrescriptionTreatmentTypeCode.CONTINUOUS
  )
  const treatmentTypeAcute = new prescriptions.PrescriptionTreatmentType(
    codes.PrescriptionTreatmentTypeCode.ACUTE
  )
  const exampleRepeatNumber = new core.Interval(new core.NumericValue("1"), new core.NumericValue("6"))

  test("repeat dispensing prescription", () => {
    const result = createCourseOfTherapyType(treatmentTypeRepeatDispensing, exampleRepeatNumber)
    expect(result).toEqual(COURSE_OF_THERAPY_TYPE.CONTINOUS_REPEAT_DISPENSING)
  })

  test("repeat prescribing prescription", () => {
    const result = createCourseOfTherapyType(treatmentTypeRepeatPrescribing, exampleRepeatNumber)
    expect(result).toEqual(COURSE_OF_THERAPY_TYPE.CONTINUOUS)
  })

  test("acute / mixed prescription, repeat prescribing line item", () => {
    const result = createCourseOfTherapyType(treatmentTypeAcute, exampleRepeatNumber)
    expect(result).toEqual(COURSE_OF_THERAPY_TYPE.CONTINUOUS)
  })

  test("acute / mixed prescription, acute line item", () => {
    const result = createCourseOfTherapyType(treatmentTypeAcute, null)
    expect(result).toEqual(COURSE_OF_THERAPY_TYPE.ACUTE)
  })
})

describe("dosage", () => {
  const exampleDosageInstructions = new prescriptions.DosageInstructions("As required")
  const exampleAdditionalInstructions = "Additional instructions"

  test("contains text", () => {
    const result = createDosage(exampleDosageInstructions, null)
    expect(result.text).toEqual("As required")
  })

  test("handles no additional instructions", () => {
    const result = createDosage(exampleDosageInstructions, null)
    expect(result.patientInstruction).toBeFalsy()
  })

  test("handles additional instructions", () => {
    const result = createDosage(exampleDosageInstructions, exampleAdditionalInstructions)
    expect(result.patientInstruction).toEqual("Additional instructions")
  })
})

describe("dispenseRequest", () => {
  const exampleDispensingSitePreference = new prescriptions.DispensingSitePreference(
    new codes.DispensingSitePreferenceCode("P1")
  )
  const exampleQuantity = new core.QuantityInAlternativeUnits("28", "28", new codes.SnomedCode("732936001", "Tablet"))
  const exampleLineItemQuantity = new prescriptions.LineItemQuantity()
  exampleLineItemQuantity.quantity = exampleQuantity
  const exampleEffectiveTime = new core.Interval(new core.Timestamp("20210101"), new core.Timestamp("20210201"))
  const exampleExpectedUseTime = new core.IntervalUnanchored("28", "d")

  test("contains dispensing site preference", () => {
    const result = createDispenseRequest(exampleDispensingSitePreference, exampleLineItemQuantity, null, null)
    expect(result.extension).toContainEqual({
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-performerSiteType",
      valueCoding: {
        code: "https://fhir.nhs.uk/CodeSystem/dispensing-site-preference",
        display: "P1"
      }
    })
  })

  test("contains quantity", () => {
    const result = createDispenseRequest(exampleDispensingSitePreference, exampleLineItemQuantity, null, null)
    expect(result.quantity).toEqual({
      code: "732936001",
      system: "http://snomed.info/sct",
      unit: "Tablet",
      value: "28"
    })
  })

  test("handles no expected supply duration or validity period", () => {
    const result = createDispenseRequest(exampleDispensingSitePreference, exampleLineItemQuantity, null, null)
    expect(result.expectedSupplyDuration).toBeFalsy()
    expect(result.validityPeriod).toBeFalsy()
  })

  test("handles validity period", () => {
    const daysSupply = new prescriptions.DaysSupply()
    daysSupply.effectiveTime = exampleEffectiveTime
    const result = createDispenseRequest(exampleDispensingSitePreference, exampleLineItemQuantity, daysSupply, null)
    expect(result.expectedSupplyDuration).toBeFalsy()
    expect(result.validityPeriod).toEqual({
      start: "2021-01-01",
      end: "2021-02-01"
    })
  })

  test("handles validity period start only", () => {
    const daysSupply = new prescriptions.DaysSupply()
    daysSupply.effectiveTime = {low: new core.Timestamp("20210101")}
    const result = createDispenseRequest(exampleDispensingSitePreference, exampleLineItemQuantity, daysSupply, null)
    expect(result.expectedSupplyDuration).toBeFalsy()
    expect(result.validityPeriod).toEqual({
      start: "2021-01-01"
    })
  })

  test("handles validity period end only", () => {
    const daysSupply = new prescriptions.DaysSupply()
    daysSupply.effectiveTime = {high: new core.Timestamp("20210301")}
    const result = createDispenseRequest(exampleDispensingSitePreference, exampleLineItemQuantity, daysSupply, null)
    expect(result.expectedSupplyDuration).toBeFalsy()
    expect(result.validityPeriod).toEqual({
      end: "2021-03-01"
    })
  })

  test("handles expected supply duration", () => {
    const daysSupply = new prescriptions.DaysSupply()
    daysSupply.expectedUseTime = exampleExpectedUseTime
    const result = createDispenseRequest(exampleDispensingSitePreference, exampleLineItemQuantity, daysSupply, null)
    expect(result.expectedSupplyDuration).toEqual({
      code: "d",
      system: "http://unitsofmeasure.org",
      unit: "day",
      value: "28"
    })
    expect(result.validityPeriod).toBeFalsy()
  })

  test("handles expected supply duration and validity period", () => {
    const daysSupply = new prescriptions.DaysSupply()
    daysSupply.effectiveTime = exampleEffectiveTime
    daysSupply.expectedUseTime = exampleExpectedUseTime
    const result = createDispenseRequest(exampleDispensingSitePreference, exampleLineItemQuantity, daysSupply, null)
    expect(result.expectedSupplyDuration).toEqual({
      code: "d",
      system: "http://unitsofmeasure.org",
      unit: "day",
      value: "28"
    })
    expect(result.validityPeriod).toEqual({
      start: "2021-01-01",
      end: "2021-02-01"
    })
  })

  test("handles no performer", () => {
    const result = createDispenseRequest(exampleDispensingSitePreference, exampleLineItemQuantity, null, null)
    expect(result.performer).toBeFalsy()
  })

  test("handles performer", () => {
    const organization = new Organization()
    organization.id = new codes.SdsOrganizationIdentifier("VNE51")
    const performer = new prescriptions.Performer(new AgentOrganization(organization))
    const result = createDispenseRequest(exampleDispensingSitePreference, exampleLineItemQuantity, null, performer)
    expect(result.performer).toEqual({
      identifier: {
        system: "https://fhir.nhs.uk/Id/ods-organization-code",
        value: "VNE51"
      }
    })
  })
})
