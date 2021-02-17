import * as fhir from "../../../../models/fhir/fhir-resources"
import {
  DaysSupply,
  DispensingSitePreference,
  DosageInstructions,
  LineItem,
  LineItemQuantity,
  Performer,
  Prescription,
  PrescriptionEndorsement,
  PrescriptionTreatmentType,
  PrescriptionType,
  ReviewDate
} from "../../../../models/hl7-v3/hl7-v3-prescriptions"
import * as uuid from "uuid"
import {
  createGroupIdentifier,
  createItemNumberIdentifier,
  createResponsiblePractitionerExtension
} from "../medication-request"
import {createCodeableConcept, createReference} from "../fhir-base-types"
import * as codes from "../../../../models/hl7-v3/hl7-v3-datatypes-codes"
import {PrescriptionTreatmentTypeCode, SnomedCode} from "../../../../models/hl7-v3/hl7-v3-datatypes-codes"
import {CourseOfTherapyTypeCode} from "../../prescription/course-of-therapy-type"
import {Interval, IntervalUnanchored, NumericValue, Timestamp} from "../../../../models/hl7-v3/hl7-v3-datatypes-core"
import {convertHL7V3DateToIsoDateString, toArray} from "../../common"
import {Organization} from "../../../../models/hl7-v3/hl7-v3-people-places"
import {parseAdditionalInstructions} from "./additional-instructions"

export const COURSE_OF_THERAPY_TYPE = Object.freeze({
  ACUTE: createCodeableConcept(
    "http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy",
    CourseOfTherapyTypeCode.ACUTE,
    "Short course (acute) therapy"
  ),
  CONTINUOUS: createCodeableConcept(
    "http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy",
    CourseOfTherapyTypeCode.CONTINUOUS,
    "Continuous long term therapy"
  ),
  CONTINOUS_REPEAT_DISPENSING: createCodeableConcept(
    "https://fhir.nhs.uk/CodeSystem/medicationrequest-course-of-therapy",
    CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING,
    "Continuous long term (repeat dispensing)"
  )
})

export function createMedicationRequest(
  prescription: Prescription,
  lineItem: LineItem,
  patientId: string,
  requesterId: string,
  responsiblePartyId: string
): fhir.MedicationRequest {
  const additionalInstructionsText = lineItem.pertinentInformation1
    ? lineItem.pertinentInformation1.pertinentAdditionalInstructions.value._text
    : ""
  const additionalInstructions = parseAdditionalInstructions(additionalInstructionsText)
  const pertinentInformation3Array = lineItem.pertinentInformation3
    ? toArray(lineItem.pertinentInformation3)
    : []
  return {
    resourceType: "MedicationRequest",
    id: uuid.v4(),
    extension: createMedicationRequestExtensions(
      responsiblePartyId,
      prescription.pertinentInformation4.pertinentPrescriptionType,
      lineItem.repeatNumber,
      prescription.pertinentInformation7.pertinentReviewDate,
      pertinentInformation3Array.map(pi3 => pi3.pertinentPrescriberEndorsement),
      additionalInstructions.controlledDrugWords
    ),
    identifier: [
      createItemNumberIdentifier(lineItem.id._attributes.root)
    ],
    status: "active", //TODO - check this
    intent: "order",
    medicationCodeableConcept: createSnomedCodeableConcept(
      lineItem.product.manufacturedProduct.manufacturedRequestedMaterial.code
    ),
    subject: createReference(patientId),
    authoredOn: undefined, //TODO - how do we populate this?
    requester: createReference(requesterId),
    groupIdentifier: createGroupIdentifierFromPrescriptionIds(prescription.id),
    courseOfTherapyType: createCourseOfTherapyType(
      prescription.pertinentInformation5.pertinentPrescriptionTreatmentType,
      lineItem.repeatNumber
    ),
    dosageInstruction: [
      createDosage(
        lineItem.pertinentInformation2.pertinentDosageInstructions,
        additionalInstructions.additionalInstructions
      )
    ],
    dispenseRequest: createDispenseRequest(
      prescription.pertinentInformation1.pertinentDispensingSitePreference,
      lineItem.component.lineItemQuantity,
      prescription.component1.daysSupply,
      prescription.performer
    ),
    substitution: createSubstitution()
  }
}

export function createMedicationRequestExtensions(
  responsiblePartyId: string,
  prescriptionType: PrescriptionType,
  lineItemRepeatNumber: Interval<NumericValue>,
  reviewDate: ReviewDate,
  lineItemEndorsements: Array<PrescriptionEndorsement>,
  controlledDrugWords: string
): Array<fhir.MedicationRequestExtension> {
  const extensions: Array<fhir.MedicationRequestExtension> = [
    createResponsiblePractitionerExtension(responsiblePartyId),
    createPrescriptionTypeExtension(prescriptionType),
    ...lineItemEndorsements.map(createEndorsementExtension)
  ]
  //TODO - is this the correct condition? could we have a review date without a repeat number?
  if (lineItemRepeatNumber) {
    const repeatInformationExtension = createRepeatInformationExtension(reviewDate, lineItemRepeatNumber)
    extensions.push(repeatInformationExtension)
  }
  if (controlledDrugWords) {
    const controlledDrugExtension = createControlledDrugExtension(controlledDrugWords)
    extensions.push(controlledDrugExtension)
  }
  return extensions
}

function createRepeatInformationExtension(
  reviewDate: ReviewDate,
  lineItemRepeatNumber: Interval<NumericValue>
): fhir.RepeatInformationExtension {
  return {
    url: "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
    extension: [
      {
        url: "authorisationExpiryDate",
        valueDateTime: convertHL7V3DateToIsoDateString(reviewDate.value)
      },
      {
        url: "numberOfRepeatPrescriptionsIssued",
        valueUnsignedInt: lineItemRepeatNumber.low._attributes.value
      },
      {
        url: "numberOfRepeatPrescriptionsAllowed",
        valueUnsignedInt: lineItemRepeatNumber.high._attributes.value
      }
    ]
  }
}

function createEndorsementExtension(prescriptionEndorsement: PrescriptionEndorsement): fhir.CodeableConceptExtension {
  return {
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-PrescriptionEndorsement",
    valueCodeableConcept: {
      coding: [{
        code: prescriptionEndorsement.value._attributes.code,
        system: "https://fhir.nhs.uk/CodeSystem/medicationrequest-endorsement",
        display: prescriptionEndorsement.value._attributes.displayName
      }]
    }
  }
}

function createPrescriptionTypeExtension(pertinentPrescriptionType: PrescriptionType): fhir.CodingExtension {
  return {
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType",
    valueCoding: {
      system: "https://fhir.nhs.uk/CodeSystem/prescription-type",
      code: pertinentPrescriptionType.value._attributes.code,
      display: pertinentPrescriptionType.value._attributes.displayName
    }
  }
}

function createControlledDrugExtension(controlledDrugWords: string): fhir.ControlledDrugExtension {
  return {
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ControlledDrug",
    extension: [{
      url: "quantityWords",
      valueString: controlledDrugWords
    }]
  }
}

export function createCourseOfTherapyType(
  prescriptionTreatmentType: PrescriptionTreatmentType,
  lineItemRepeatNumber: Interval<NumericValue>
): fhir.CodeableConcept {
  const isRepeatDispensing = prescriptionTreatmentType.value._attributes.code
    === PrescriptionTreatmentTypeCode.CONTINUOUS_REPEAT_DISPENSING._attributes.code
  if (isRepeatDispensing) {
    return COURSE_OF_THERAPY_TYPE.CONTINOUS_REPEAT_DISPENSING
  } else if (lineItemRepeatNumber) {
    return COURSE_OF_THERAPY_TYPE.CONTINUOUS
  } else {
    return COURSE_OF_THERAPY_TYPE.ACUTE
  }
}

export function createSnomedCodeableConcept(code: SnomedCode): fhir.CodeableConcept {
  return createCodeableConcept("http://snomed.info/sct", code._attributes.code, code._attributes.displayName)
}

export function createDosage(dosageInstructions: DosageInstructions, additionalInstructions: string): fhir.Dosage {
  const dosage: fhir.Dosage = {
    text: dosageInstructions.value._text
  }
  if (additionalInstructions) {
    dosage.patientInstruction = additionalInstructions
  }
  return dosage
}

function createDispenseRequestQuantity(lineItemQuantity: LineItemQuantity): fhir.SimpleQuantity {
  const lineItemQuantityTranslation = lineItemQuantity.quantity.translation
  return {
    value: lineItemQuantityTranslation._attributes.value,
    unit: lineItemQuantityTranslation._attributes.displayName,
    system: "http://snomed.info/sct",
    code: lineItemQuantityTranslation._attributes.code
  }
}

function createValidityPeriod(effectiveTime: Interval<Timestamp>): fhir.Period {
  return {
    start: convertHL7V3DateToIsoDateString(effectiveTime.low),
    end: convertHL7V3DateToIsoDateString(effectiveTime.high)
  }
}

function createExpectedSupplyDuration(expectedUseTime: IntervalUnanchored): fhir.SimpleQuantity {
  return {
    unit: "day",
    value: expectedUseTime.width._attributes.value,
    system: "http://unitsofmeasure.org",
    code: "d"
  }
}

export function createDispenseRequest(
  dispensingSitePreference: DispensingSitePreference,
  lineItemQuantity: LineItemQuantity,
  daysSupply: DaysSupply,
  performer: Performer
): fhir.MedicationRequestDispenseRequest {
  const dispenseRequest: fhir.MedicationRequestDispenseRequest = {
    extension: [
      createPerformerSiteTypeExtension(dispensingSitePreference)
    ],
    quantity: createDispenseRequestQuantity(lineItemQuantity)
  }
  if (daysSupply?.effectiveTime) {
    dispenseRequest.validityPeriod = createValidityPeriod(daysSupply.effectiveTime)
  }
  if (daysSupply?.expectedUseTime) {
    dispenseRequest.expectedSupplyDuration = createExpectedSupplyDuration(daysSupply.expectedUseTime)
  }
  if (performer) {
    dispenseRequest.performer = createPerformer(performer.AgentOrgSDS.agentOrganizationSDS)
  }
  return dispenseRequest
}

function createPerformerSiteTypeExtension(dispensingSitePreference: DispensingSitePreference): fhir.CodingExtension {
  return {
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-performerSiteType",
    valueCoding: {
      code: "https://fhir.nhs.uk/CodeSystem/dispensing-site-preference",
      display: dispensingSitePreference.value._attributes.code
    }
  }
}

function createPerformer(performerOrganization: Organization): fhir.Performer {
  return {
    identifier: {
      system: "https://fhir.nhs.uk/Id/ods-organization-code",
      value: performerOrganization.id._attributes.extension
    }
  }
}

export function createGroupIdentifierFromPrescriptionIds(
  prescriptionIds: [codes.GlobalIdentifier, codes.ShortFormPrescriptionIdentifier]
): fhir.MedicationRequestGroupIdentifier {
  const shortFormId = prescriptionIds[1]._attributes.extension
  const longFormId = prescriptionIds[0]._attributes.root //TODO - lower case?
  return createGroupIdentifier(shortFormId, longFormId)
}

function createSubstitution() {
  return {
    allowedBoolean: false as const
  }
}
