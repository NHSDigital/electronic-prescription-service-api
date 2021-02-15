import * as fhir from "../../../../models/fhir/fhir-resources"
import {LineItem, Prescription} from "../../../../models/hl7-v3/hl7-v3-prescriptions"
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
import {Interval, IntervalUnanchored, Timestamp} from "../../../../models/hl7-v3/hl7-v3-datatypes-core"
import {convertHL7V3DateToIsoDateString} from "../../common"

export function createMedicationRequest(
  prescription: Prescription,
  lineItem: LineItem,
  patientId: string,
  requesterId: string,
  responsiblePartyId: string
): fhir.MedicationRequest {
  return {
    resourceType: "MedicationRequest",
    id: uuid.v4(),
    extension: [
      //TODO - repeat information
      createResponsiblePractitionerExtension(responsiblePartyId)
      //TODO - endorsements
      //TODO - prescription type
      //TODO - controlled drugs
    ],
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
    courseOfTherapyType: createCourseOfTherapyType(prescription, lineItem),
    dosageInstruction: [
      createDosage(lineItem)
    ],
    dispenseRequest: createDispenseRequest(prescription, lineItem),
    substitution: createSubstitution()
  }
}

function isRepeatDispensing(prescription: Prescription) {
  const prescriptionTreatmentTypeCode = prescription.pertinentInformation5.pertinentPrescriptionTreatmentType.value
  return prescriptionTreatmentTypeCode._attributes.code
    === PrescriptionTreatmentTypeCode.CONTINUOUS_REPEAT_DISPENSING._attributes.code
}

function createCourseOfTherapyType(prescription: Prescription, lineItem: LineItem) {
  if (isRepeatDispensing(prescription)) {
    return createCodeableConcept(
      "https://fhir.nhs.uk/CodeSystem/medicationrequest-course-of-therapy",
      CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING,
      "Continuous long term (repeat dispensing)"
    )
  } else if (lineItem.repeatNumber) {
    return createCodeableConcept(
      "http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy",
      CourseOfTherapyTypeCode.CONTINUOUS,
      "Continuous long term therapy"
    )
  } else {
    return createCodeableConcept(
      "http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy",
      CourseOfTherapyTypeCode.ACUTE,
      "Short course (acute) therapy"
    )
  }
}

function createSnomedCodeableConcept(code: SnomedCode) {
  return createCodeableConcept("http://snomed.info/sct", code._attributes.code, code._attributes.displayName)
}

function createDosage(lineItem: LineItem): fhir.Dosage {
  //TODO - additional instructions
  return {
    text: lineItem.pertinentInformation2.pertinentDosageInstructions.value._text
  }
}

function createDispenseRequestQuantity(lineItem: LineItem): fhir.SimpleQuantity {
  const lineItemQuantityTranslation = lineItem.component.lineItemQuantity.quantity.translation
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

function createDispenseRequest(prescription: Prescription, lineItem: LineItem): fhir.MedicationRequestDispenseRequest {
  const dispenseRequest: fhir.MedicationRequestDispenseRequest = {
    extension: [
      createPerformerSiteTypeExtension(prescription)
    ],
    quantity: createDispenseRequestQuantity(lineItem)
  }
  if (isRepeatDispensing(prescription)) {
    const daysSupply = prescription.component1.daysSupply
    dispenseRequest.validityPeriod = createValidityPeriod(daysSupply.effectiveTime)
    dispenseRequest.expectedSupplyDuration = createExpectedSupplyDuration(daysSupply.expectedUseTime)
  }
  //TODO - performer
  return dispenseRequest
}

function createPerformerSiteTypeExtension(prescription: Prescription): fhir.CodingExtension {
  return {
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-performerSiteType",
    valueCoding: {
      code: "https://fhir.nhs.uk/CodeSystem/dispensing-site-preference",
      display: prescription.pertinentInformation1.pertinentDispensingSitePreference.value._attributes.code
    }
  }
}

function createGroupIdentifierFromPrescriptionIds(
  prescriptionIds: [codes.GlobalIdentifier, codes.ShortFormPrescriptionIdentifier]
) {
  const shortFormId = prescriptionIds[1]._attributes.extension
  const longFormId = prescriptionIds[0]._attributes.root //TODO - lower case?
  return createGroupIdentifier(shortFormId, longFormId)
}

function createSubstitution() {
  return {
    allowedBoolean: false as const
  }
}
