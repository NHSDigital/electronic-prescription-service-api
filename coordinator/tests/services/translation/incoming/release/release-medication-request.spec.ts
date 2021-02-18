import {
  COURSE_OF_THERAPY_TYPE,
  createCourseOfTherapyType, createDispenseRequest, createDosage,
  createGroupIdentifierFromPrescriptionIds,
  createMedicationRequestExtensions, createSnomedCodeableConcept
} from "../../../../../src/services/translation/incoming/release/release-medication-request"
import {
  DaysSupply,
  DispensingSitePreference,
  DosageInstructions, LineItemQuantity, Performer,
  PrescriptionEndorsement, PrescriptionTreatmentType,
  PrescriptionType,
  ReviewDate
} from "../../../../../src/models/hl7-v3/hl7-v3-prescriptions"
import {
  DispensingSitePreferenceCode,
  GlobalIdentifier,
  PrescriptionEndorsementCode, PrescriptionTreatmentTypeCode,
  PrescriptionTypeCode, SdsOrganizationIdentifier, ShortFormPrescriptionIdentifier, SnomedCode
} from "../../../../../src/models/hl7-v3/hl7-v3-datatypes-codes"
import {
  CodeableConceptExtension,
  CodingExtension, ControlledDrugExtension,
  PractitionerRole,
  ReferenceExtension, RepeatInformationExtension
} from "../../../../../../tests/e2e/pact/models/fhir/fhir-resources"
import {
  Interval, IntervalUnanchored,
  NumericValue,
  QuantityInAlternativeUnits,
  Timestamp
} from "../../../../../src/models/hl7-v3/hl7-v3-datatypes-core"
import {AgentOrganization, Organization} from "../../../../../src/models/hl7-v3/hl7-v3-people-places"

describe("extensions", () => {
  const exampleResponsiblePartyId = "responsiblePartyId"
  const examplePrescriptionType = new PrescriptionType(new PrescriptionTypeCode("0101"))
  const examplePrescriptionEndorsement1 = new PrescriptionEndorsement(new PrescriptionEndorsementCode("CC"))
  const examplePrescriptionEndorsement2 = new PrescriptionEndorsement(new PrescriptionEndorsementCode("FS"))
  const exampleRepeatNumber = new Interval(new NumericValue("1"), new NumericValue("6"))
  const exampleReviewDate = new ReviewDate(new Timestamp("20210301"))
  const exampleControlledDrugWords = "twenty eight"

  test("responsible practitioner", () => {
    const result = createMedicationRequestExtensions(
      exampleResponsiblePartyId,
      examplePrescriptionType,
      null,
      null,
      [],
      null
    )
    const expected: ReferenceExtension<PractitionerRole> = {
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ResponsiblePractitioner",
      valueReference: {
        reference: "urn:uuid:responsiblePartyId"
      }
    }
    expect(result).toContainEqual(expected)
  })

  test("prescription type", () => {
    const result = createMedicationRequestExtensions(
      exampleResponsiblePartyId,
      examplePrescriptionType,
      null,
      null,
      [],
      null
    )
    const expected: CodingExtension = {
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType",
      valueCoding: {
        system: "https://fhir.nhs.uk/CodeSystem/prescription-type",
        code: "0101"
      }
    }
    expect(result).toContainEqual(expected)
  })

  test("no endorsements", () => {
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

  test("single endorsement", () => {
    const result = createMedicationRequestExtensions(
      exampleResponsiblePartyId,
      examplePrescriptionType,
      null,
      null,
      [examplePrescriptionEndorsement1],
      null
    )
    const expected: CodeableConceptExtension = {
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

  test("multiple endorsements", () => {
    const result = createMedicationRequestExtensions(
      exampleResponsiblePartyId,
      examplePrescriptionType,
      null,
      null,
      [examplePrescriptionEndorsement1, examplePrescriptionEndorsement2],
      null
    )
    const expected1: CodeableConceptExtension = {
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-PrescriptionEndorsement",
      valueCodeableConcept: {
        coding: [{
          code: "CC",
          system: "https://fhir.nhs.uk/CodeSystem/medicationrequest-endorsement"
        }]
      }
    }
    const expected2: CodeableConceptExtension = {
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

  test("no repeat information", () => {
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

  test("repeat information", () => {
    const result = createMedicationRequestExtensions(
      exampleResponsiblePartyId,
      examplePrescriptionType,
      exampleRepeatNumber,
      exampleReviewDate,
      [],
      null
    )
    const expected: RepeatInformationExtension = {
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

  test("no controlled drug words", () => {
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

  test("controlled drug words", () => {
    const result = createMedicationRequestExtensions(
      exampleResponsiblePartyId,
      examplePrescriptionType,
      null,
      null,
      [],
      exampleControlledDrugWords
    )
    const expected: ControlledDrugExtension = {
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ControlledDrug",
      extension: [{
        url: "quantityWords",
        valueString: "twenty eight"
      }]
    }
    expect(result).toContainEqual(expected)
  })
})

describe("medication", () => {
  const exampleMedicationCode = new SnomedCode("322237000", "Paracetamol 500mg soluble tablets")

  test("medicationCodeableConcept", () => {
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
  const examplePrescriptionIds: [GlobalIdentifier, ShortFormPrescriptionIdentifier] = [
    new GlobalIdentifier("B2FC79F0-2793-4736-9B2D-0976C21E73A5"),
    new ShortFormPrescriptionIdentifier("6F5652-Z8866F-11EBAE")
  ]
  test("groupIdentifier", () => {
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
  const pttRepeatDispensing = new PrescriptionTreatmentType(PrescriptionTreatmentTypeCode.CONTINUOUS_REPEAT_DISPENSING)
  const pttRepeatPrescribing = new PrescriptionTreatmentType(PrescriptionTreatmentTypeCode.CONTINUOUS)
  const pttAcute = new PrescriptionTreatmentType(PrescriptionTreatmentTypeCode.ACUTE)
  const exampleRepeatNumber = new Interval(new NumericValue("1"), new NumericValue("6"))

  test("repeat dispensing prescription", () => {
    const result = createCourseOfTherapyType(pttRepeatDispensing, exampleRepeatNumber)
    expect(result).toEqual(COURSE_OF_THERAPY_TYPE.CONTINOUS_REPEAT_DISPENSING)
  })

  test("repeat prescribing prescription", () => {
    const result = createCourseOfTherapyType(pttRepeatPrescribing, exampleRepeatNumber)
    expect(result).toEqual(COURSE_OF_THERAPY_TYPE.CONTINUOUS)
  })

  test("acute / mixed prescription, repeat prescribing line item", () => {
    const result = createCourseOfTherapyType(pttAcute, exampleRepeatNumber)
    expect(result).toEqual(COURSE_OF_THERAPY_TYPE.CONTINUOUS)
  })

  test("acute / mixed prescription, acute line item", () => {
    const result = createCourseOfTherapyType(pttAcute, null)
    expect(result).toEqual(COURSE_OF_THERAPY_TYPE.ACUTE)
  })
})

describe("dosage", () => {
  const exampleDosageInstructions = new DosageInstructions("As required")
  const exampleAdditionalInstructions = "Additional instructions"

  test("text", () => {
    const result = createDosage(exampleDosageInstructions, null)
    expect(result.text).toEqual("As required")
  })

  test("no additional instructions", () => {
    const result = createDosage(exampleDosageInstructions, null)
    expect(result.patientInstruction).toBeFalsy()
  })

  test("additional instructions", () => {
    const result = createDosage(exampleDosageInstructions, exampleAdditionalInstructions)
    expect(result.patientInstruction).toEqual("Additional instructions")
  })
})

describe("dispenseRequest", () => {
  const exampleDispensingSitePreference = new DispensingSitePreference(new DispensingSitePreferenceCode("P1"))
  const exampleQuantity = new QuantityInAlternativeUnits("28", "28", new SnomedCode("732936001", "Tablet"))
  const exampleLineItemQuantity = new LineItemQuantity()
  exampleLineItemQuantity.quantity = exampleQuantity
  const exampleEffectiveTime = new Interval<Timestamp>(new Timestamp("20210101"), new Timestamp("20210201"))
  const exampleExpectedUseTime = new IntervalUnanchored("28", "d")

  test("dispensing site preference", () => {
    const result = createDispenseRequest(exampleDispensingSitePreference, exampleLineItemQuantity, null, null)
    expect(result.extension).toContainEqual({
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-performerSiteType",
      valueCoding: {
        code: "https://fhir.nhs.uk/CodeSystem/dispensing-site-preference",
        display: "P1"
      }
    })
  })

  test("quantity", () => {
    const result = createDispenseRequest(exampleDispensingSitePreference, exampleLineItemQuantity, null, null)
    expect(result.quantity).toEqual({
      code: "732936001",
      system: "http://snomed.info/sct",
      unit: "Tablet",
      value: "28"
    })
  })

  test("no expected supply duration or validity period", () => {
    const result = createDispenseRequest(exampleDispensingSitePreference, exampleLineItemQuantity, null, null)
    expect(result.expectedSupplyDuration).toBeFalsy()
    expect(result.validityPeriod).toBeFalsy()
  })

  test("validity period", () => {
    const daysSupply = new DaysSupply()
    daysSupply.effectiveTime = exampleEffectiveTime
    const result = createDispenseRequest(exampleDispensingSitePreference, exampleLineItemQuantity, daysSupply, null)
    expect(result.expectedSupplyDuration).toBeFalsy()
    expect(result.validityPeriod).toEqual({
      start: "2021-01-01",
      end: "2021-02-01"
    })
  })

  test("validity period start only", () => {
    const daysSupply = new DaysSupply()
    daysSupply.effectiveTime = {low: new Timestamp("20210101")}
    const result = createDispenseRequest(exampleDispensingSitePreference, exampleLineItemQuantity, daysSupply, null)
    expect(result.expectedSupplyDuration).toBeFalsy()
    expect(result.validityPeriod).toEqual({
      start: "2021-01-01"
    })
  })

  test("validity period end only", () => {
    const daysSupply = new DaysSupply()
    daysSupply.effectiveTime = {high: new Timestamp("20210301")}
    const result = createDispenseRequest(exampleDispensingSitePreference, exampleLineItemQuantity, daysSupply, null)
    expect(result.expectedSupplyDuration).toBeFalsy()
    expect(result.validityPeriod).toEqual({
      end: "2021-03-01"
    })
  })

  test("expected supply duration", () => {
    const daysSupply = new DaysSupply()
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

  test("expected supply duration and validity period", () => {
    const daysSupply = new DaysSupply()
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

  test("no performer", () => {
    const result = createDispenseRequest(exampleDispensingSitePreference, exampleLineItemQuantity, null, null)
    expect(result.performer).toBeFalsy()
  })

  test("performer", () => {
    const organization = new Organization()
    organization.id = new SdsOrganizationIdentifier("VNE51")
    const performer = new Performer(new AgentOrganization(organization))
    const result = createDispenseRequest(exampleDispensingSitePreference, exampleLineItemQuantity, null, performer)
    expect(result.performer).toEqual({
      identifier: {
        system: "https://fhir.nhs.uk/Id/ods-organization-code",
        value: "VNE51"
      }
    })
  })
})
