import * as fhir from "../../../../models/fhir/fhir-resources"
import * as codes from "../../../../models/hl7-v3/hl7-v3-datatypes-codes"
import * as core from "../../../../models/hl7-v3/hl7-v3-datatypes-core"
import * as organisations from "../../../../models/hl7-v3/hl7-v3-people-places"
import * as prescriptions from "../../../../models/hl7-v3/hl7-v3-prescriptions"
import * as uuid from "uuid"
import {
  createGroupIdentifier,
  createItemNumberIdentifier,
  createResponsiblePractitionerExtension
} from "../medication-request"
import {createCodeableConcept, createReference} from "../fhir-base-types"
import {toArray} from "../../common"
import {parseAdditionalInstructions} from "./additional-instructions"
import {convertHL7V3DateToIsoDateString} from "../../common/dateTime"
import * as medicationRequest from "../../../../models/fhir/medication-request"

export function createMedicationRequest(
  prescription: prescriptions.Prescription,
  lineItem: prescriptions.LineItem,
  patientId: string,
  requesterId: string,
  responsiblePartyId: string
): medicationRequest.MedicationRequest {
  const text = lineItem.pertinentInformation1?.pertinentAdditionalInstructions?.value?._text ?? ""
  const additionalInstructions = parseAdditionalInstructions(text)
  return {
    resourceType: "MedicationRequest",
    id: uuid.v4(),
    extension: createMedicationRequestExtensions(
      responsiblePartyId,
      prescription.pertinentInformation4.pertinentPrescriptionType,
      lineItem.repeatNumber,
      prescription.pertinentInformation7?.pertinentReviewDate,
      toArray(lineItem.pertinentInformation3 ?? []).map(pi3 => pi3.pertinentPrescriberEndorsement),
      additionalInstructions.controlledDrugWords
    ),
    identifier: [
      createItemNumberIdentifier(lineItem.id._attributes.root)
    ],
    status: getStatus(lineItem.pertinentInformation4.pertinentItemStatus),
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
  prescriptionType: prescriptions.PrescriptionType,
  lineItemRepeatNumber: core.Interval<core.NumericValue>,
  reviewDate: prescriptions.ReviewDate,
  lineItemEndorsements: Array<prescriptions.PrescriptionEndorsement>,
  controlledDrugWords: string
): Array<medicationRequest.MedicationRequestPermittedExtensions> {
  const extensions: Array<medicationRequest.MedicationRequestPermittedExtensions> = [
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
  reviewDate: prescriptions.ReviewDate,
  lineItemRepeatNumber: core.Interval<core.NumericValue>
): medicationRequest.RepeatInformationExtension {
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

function createEndorsementExtension(
  prescriptionEndorsement: prescriptions.PrescriptionEndorsement
): fhir.CodeableConceptExtension {
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

function createPrescriptionTypeExtension(
  pertinentPrescriptionType: prescriptions.PrescriptionType
): fhir.CodingExtension {
  return {
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType",
    valueCoding: {
      system: "https://fhir.nhs.uk/CodeSystem/prescription-type",
      code: pertinentPrescriptionType.value._attributes.code,
      display: pertinentPrescriptionType.value._attributes.displayName
    }
  }
}

function createControlledDrugExtension(controlledDrugWords: string): medicationRequest.ControlledDrugExtension {
  return {
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ControlledDrug",
    extension: [{
      url: "quantityWords",
      valueString: controlledDrugWords
    }]
  }
}

export function createCourseOfTherapyType(
  prescriptionTreatmentType: prescriptions.PrescriptionTreatmentType,
  lineItemRepeatNumber: core.Interval<core.NumericValue>
): fhir.CodeableConcept {
  const isRepeatDispensing = prescriptionTreatmentType.value._attributes.code
    === codes.PrescriptionTreatmentTypeCode.CONTINUOUS_REPEAT_DISPENSING._attributes.code
  if (isRepeatDispensing) {
    return medicationRequest.CourseOfTherapyType.CONTINOUS_REPEAT_DISPENSING
  } else if (lineItemRepeatNumber) {
    return medicationRequest.CourseOfTherapyType.CONTINUOUS
  } else {
    return medicationRequest.CourseOfTherapyType.ACUTE
  }
}

export function getStatus(pertinentItemStatus: prescriptions.ItemStatus): medicationRequest.MedicationRequestStatus {
  const itemStatusCode = pertinentItemStatus.value._attributes.code
  switch (itemStatusCode) {
    case codes.ItemStatusCode.FULLY_DISPENSED._attributes.code:
      return medicationRequest.MedicationRequestStatus.COMPLETED
    case codes.ItemStatusCode.NOT_DISPENSED._attributes.code:
    case codes.ItemStatusCode.EXPIRED._attributes.code:
      return medicationRequest.MedicationRequestStatus.STOPPED
    case codes.ItemStatusCode.DISPENSED_PARTIAL._attributes.code:
    case codes.ItemStatusCode.NOT_DISPENSED_OWING._attributes.code:
    case codes.ItemStatusCode.TO_BE_DISPENSED._attributes.code:
    case codes.ItemStatusCode.WITH_DISPENSER._attributes.code:
      return medicationRequest.MedicationRequestStatus.ACTIVE
    case codes.ItemStatusCode.CANCELLED._attributes.code:
      return medicationRequest.MedicationRequestStatus.CANCELLED
    default:
      throw new TypeError(`Unhandled item status code ${itemStatusCode}`)
  }
}

export function createSnomedCodeableConcept(code: codes.SnomedCode): fhir.CodeableConcept {
  return createCodeableConcept("http://snomed.info/sct", code._attributes.code, code._attributes.displayName)
}

export function createDosage(
  dosageInstructions: prescriptions.DosageInstructions,
  additionalInstructions: string
): medicationRequest.Dosage {
  const dosage: medicationRequest.Dosage = {
    text: dosageInstructions.value._text
  }
  if (additionalInstructions) {
    dosage.patientInstruction = additionalInstructions
  }
  return dosage
}

function createDispenseRequestQuantity(lineItemQuantity: prescriptions.LineItemQuantity): fhir.SimpleQuantity {
  const lineItemQuantityTranslation = lineItemQuantity.quantity.translation
  return {
    value: lineItemQuantityTranslation._attributes.value,
    unit: lineItemQuantityTranslation._attributes.displayName,
    system: "http://snomed.info/sct",
    code: lineItemQuantityTranslation._attributes.code
  }
}

function createValidityPeriod(effectiveTime: core.Interval<core.Timestamp>): fhir.Period {
  const validityPeriod: fhir.Period = {}
  if (effectiveTime.low) {
    validityPeriod.start = convertHL7V3DateToIsoDateString(effectiveTime.low)
  }
  if (effectiveTime.high) {
    validityPeriod.end = convertHL7V3DateToIsoDateString(effectiveTime.high)
  }
  return validityPeriod
}

function createExpectedSupplyDuration(expectedUseTime: core.IntervalUnanchored): fhir.SimpleQuantity {
  return {
    unit: "day",
    value: expectedUseTime.width._attributes.value,
    system: "http://unitsofmeasure.org",
    code: "d"
  }
}

export function createDispenseRequest(
  dispensingSitePreference: prescriptions.DispensingSitePreference,
  lineItemQuantity: prescriptions.LineItemQuantity,
  daysSupply: prescriptions.DaysSupply,
  performer: prescriptions.Performer
): medicationRequest.MedicationRequestDispenseRequest {
  const dispenseRequest: medicationRequest.MedicationRequestDispenseRequest = {
    extension: [
      createPerformerSiteTypeExtension(dispensingSitePreference)
    ],
    quantity: createDispenseRequestQuantity(lineItemQuantity)
  }
  if (daysSupply?.effectiveTime?.low || daysSupply?.effectiveTime?.high) {
    dispenseRequest.validityPeriod = createValidityPeriod(daysSupply.effectiveTime)
  }
  if (daysSupply?.expectedUseTime?.width) {
    dispenseRequest.expectedSupplyDuration = createExpectedSupplyDuration(daysSupply.expectedUseTime)
  }
  if (performer) {
    dispenseRequest.performer = createPerformer(performer.AgentOrgSDS.agentOrganizationSDS)
  }
  return dispenseRequest
}

function createPerformerSiteTypeExtension(
  dispensingSitePreference: prescriptions.DispensingSitePreference
): fhir.CodingExtension {
  return {
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-performerSiteType",
    valueCoding: {
      code: "https://fhir.nhs.uk/CodeSystem/dispensing-site-preference",
      display: dispensingSitePreference.value._attributes.code
    }
  }
}

function createPerformer(performerOrganization: organisations.Organization): medicationRequest.Performer {
  return {
    identifier: {
      system: "https://fhir.nhs.uk/Id/ods-organization-code",
      value: performerOrganization.id._attributes.extension
    }
  }
}

export function createGroupIdentifierFromPrescriptionIds(
  prescriptionIds: [codes.GlobalIdentifier, codes.ShortFormPrescriptionIdentifier]
): medicationRequest.MedicationRequestGroupIdentifier {
  const shortFormId = prescriptionIds[1]._attributes.extension
  const longFormId = prescriptionIds[0]._attributes.root.toLowerCase()
  return createGroupIdentifier(shortFormId, longFormId)
}

function createSubstitution() {
  return {
    allowedBoolean: false as const
  }
}
