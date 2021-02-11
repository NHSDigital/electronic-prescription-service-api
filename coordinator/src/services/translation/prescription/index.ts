import * as core from "../../../models/hl7-v3/hl7-v3-datatypes-core"
import {Interval, IntervalUnanchored, NumericValue, Timestamp} from "../../../models/hl7-v3/hl7-v3-datatypes-core"
import * as codes from "../../../models/hl7-v3/hl7-v3-datatypes-codes"
import * as prescriptions from "../../../models/hl7-v3/hl7-v3-prescriptions"
import {DaysSupply, PrescriptionPertinentInformation7, ReviewDate} from "../../../models/hl7-v3/hl7-v3-prescriptions"
import * as fhir from "../../../models/fhir/fhir-resources"
import {
  convertIsoDateStringToHl7V3Date,
  convertIsoDateTimeStringToHl7V3Date,
  getExtensionForUrl,
  getExtensionForUrlOrNull,
  getNumericValueAsString,
  isTruthy,
  resolveReference
} from "../common"
import {convertAuthor, convertResponsibleParty} from "./practitioner"
import * as peoplePlaces from "../../../models/hl7-v3/hl7-v3-people-places"
import {convertMedicationRequestToLineItem} from "./line-item"
import {getCommunicationRequests, getMedicationRequests} from "../common/getResourcesOfType"
import {CourseOfTherapyTypeCode, getCourseOfTherapyTypeCode} from "./course-of-therapy-type"
import {InvalidValueError} from "../../../models/errors/processing-errors"

export function convertBundleToPrescription(fhirBundle: fhir.Bundle): prescriptions.Prescription {
  const fhirMedicationRequests = getMedicationRequests(fhirBundle)
  const fhirFirstMedicationRequest = fhirMedicationRequests[0]

  const fhirCommunicationRequests = getCommunicationRequests(fhirBundle)

  const hl7V3Prescription = new prescriptions.Prescription(
    ...convertPrescriptionIds(fhirFirstMedicationRequest)
  )

  const repeatNumber = convertRepeatNumber(fhirMedicationRequests)
  if (repeatNumber) {
    hl7V3Prescription.repeatNumber = repeatNumber
  }

  const performer = fhirFirstMedicationRequest.dispenseRequest.performer
  if (performer) {
    hl7V3Prescription.performer = convertPerformer(performer)
  }

  hl7V3Prescription.author = convertAuthor(fhirBundle, fhirFirstMedicationRequest)
  hl7V3Prescription.responsibleParty = convertResponsibleParty(fhirBundle, fhirFirstMedicationRequest)

  if (getCourseOfTherapyTypeCode(fhirMedicationRequests) === CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING) {
    const validityPeriod = fhirFirstMedicationRequest.dispenseRequest.validityPeriod
    const expectedSupplyDuration = fhirFirstMedicationRequest.dispenseRequest.expectedSupplyDuration
    hl7V3Prescription.component1 = convertPrescriptionComponent1(validityPeriod, expectedSupplyDuration)
  }

  const reviewDate = extractReviewDate(fhirFirstMedicationRequest)
  if (reviewDate) {
    hl7V3Prescription.pertinentInformation7 = convertPrescriptionPertinentInformation7(reviewDate)
  }

  hl7V3Prescription.pertinentInformation5 = convertPrescriptionPertinentInformation5(fhirMedicationRequests)
  hl7V3Prescription.pertinentInformation1 = convertPrescriptionPertinentInformation1(fhirFirstMedicationRequest)
  hl7V3Prescription.pertinentInformation2 = convertPrescriptionPertinentInformation2(
    fhirBundle,
    fhirCommunicationRequests,
    fhirMedicationRequests,
    repeatNumber
  )
  hl7V3Prescription.pertinentInformation8 = convertPrescriptionPertinentInformation8()
  hl7V3Prescription.pertinentInformation4 = convertPrescriptionPertinentInformation4(fhirFirstMedicationRequest)

  return hl7V3Prescription
}

function convertPrescriptionIds(
  fhirFirstMedicationRequest: fhir.MedicationRequest
): [codes.GlobalIdentifier, codes.ShortFormPrescriptionIdentifier] {
  const groupIdentifier = fhirFirstMedicationRequest.groupIdentifier
  const prescriptionIdExtension = getExtensionForUrl(
    groupIdentifier.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId",
    "MedicationRequest.groupIdentifier.extension"
  ) as fhir.IdentifierExtension
  const prescriptionId = prescriptionIdExtension.valueIdentifier.value
  const prescriptionShortFormId = groupIdentifier.value
  return [
    new codes.GlobalIdentifier(prescriptionId),
    new codes.ShortFormPrescriptionIdentifier(prescriptionShortFormId)
  ]
}

export function convertPrescriptionComponent1(
  validityPeriod: fhir.Period,
  expectedSupplyDuration: fhir.SimpleQuantity
): prescriptions.Component1 {
  const daysSupply = new DaysSupply()

  const low = convertIsoDateTimeStringToHl7V3Date(
    validityPeriod.start,
    "MedicationRequest.dispenseRequest.validityPeriod.start"
  )
  const high = convertIsoDateTimeStringToHl7V3Date(
    validityPeriod.end,
    "MedicationRequest.dispenseRequest.validityPeriod.end"
  )
  daysSupply.effectiveTime = new Interval<Timestamp>(low, high)

  if (expectedSupplyDuration.code !== "d") {
    throw new InvalidValueError(
      "Expected supply duration must be specified in days.",
      "MedicationRequest.dispenseRequest.expectedSupplyDuration.code"
    )
  }
  const expectedSupplyDurationStr = getNumericValueAsString(expectedSupplyDuration.value)
  daysSupply.expectedUseTime = new IntervalUnanchored(expectedSupplyDurationStr, "d")

  return new prescriptions.Component1(daysSupply)
}

function convertPrescriptionPertinentInformation5(fhirMedicationRequests: Array<fhir.MedicationRequest>) {
  const prescriptionTreatmentType = convertCourseOfTherapyType(fhirMedicationRequests)
  return new prescriptions.PrescriptionPertinentInformation5(prescriptionTreatmentType)
}

export function convertCourseOfTherapyType(
  fhirMedicationRequests: Array<fhir.MedicationRequest>
): prescriptions.PrescriptionTreatmentType {
  const courseOfTherapyTypeCode = getCourseOfTherapyTypeCode(fhirMedicationRequests)
  const prescriptionTreatmentTypeCode = convertCourseOfTherapyTypeCode(courseOfTherapyTypeCode)
  return new prescriptions.PrescriptionTreatmentType(prescriptionTreatmentTypeCode)
}

function convertCourseOfTherapyTypeCode(courseOfTherapyTypeCode: string) {
  switch (courseOfTherapyTypeCode) {
  case CourseOfTherapyTypeCode.ACUTE:
    return codes.PrescriptionTreatmentTypeCode.ACUTE
  case CourseOfTherapyTypeCode.CONTINUOUS:
    return codes.PrescriptionTreatmentTypeCode.CONTINUOUS
  case CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING:
    return codes.PrescriptionTreatmentTypeCode.CONTINUOUS_REPEAT_DISPENSING
  default:
    throw new InvalidValueError(
      `Unhandled course of therapy type code '${courseOfTherapyTypeCode}'.`,
      "MedicationRequest.courseOfTherapyType.coding.code"
    )
  }
}

function convertPrescriptionPertinentInformation1(fhirFirstMedicationRequest: fhir.MedicationRequest) {
  const dispensingSitePreference = convertDispensingSitePreference(fhirFirstMedicationRequest)
  return new prescriptions.PrescriptionPertinentInformation1(dispensingSitePreference)
}

function convertDispensingSitePreference(
  fhirFirstMedicationRequest: fhir.MedicationRequest
): prescriptions.DispensingSitePreference {
  const performerSiteType = getExtensionForUrl(
    fhirFirstMedicationRequest.dispenseRequest.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PerformerSiteType",
    "MedicationRequest.dispenseRequest.extension"
  ) as fhir.CodingExtension
  const dispensingSitePreferenceValue = new codes.DispensingSitePreferenceCode(performerSiteType.valueCoding.code)
  return new prescriptions.DispensingSitePreference(dispensingSitePreferenceValue)
}

function isContentStringPayload(
  payload: fhir.ContentStringPayload | fhir.ContentReferencePayload
): payload is fhir.ContentStringPayload {
  return !!(payload as fhir.ContentStringPayload).contentString
}

function isContentReferencePayload(
  payload: fhir.ContentStringPayload | fhir.ContentReferencePayload
): payload is fhir.ContentReferencePayload {
  return !!(payload as fhir.ContentReferencePayload).contentReference
}

function extractPatientInfoText(fhirCommunicationRequests: Array<fhir.CommunicationRequest>): Array<core.Text> {
  return fhirCommunicationRequests
    .flatMap(communicationRequest => communicationRequest.payload)
    .filter(isTruthy)
    .filter(isContentStringPayload)
    .map(payload => payload.contentString)
    .map(contentString => new core.Text(contentString))
}

function extractMedicationListText(
  fhirBundle: fhir.Bundle,
  fhirCommunicationRequests: Array<fhir.CommunicationRequest>
): Array<core.Text> {
  return fhirCommunicationRequests
    .flatMap(communicationRequest => communicationRequest.payload)
    .filter(isTruthy)
    .filter(isContentReferencePayload)
    .map(payload => resolveReference(fhirBundle, payload.contentReference))
    .flatMap(list => list.entry)
    .map(listEntry => listEntry?.item?.display)
    .filter(isTruthy)
    .map(display => new core.Text(display))
}

function convertPrescriptionPertinentInformation2(
  fhirBundle: fhir.Bundle,
  fhirCommunicationRequests: Array<fhir.CommunicationRequest>,
  fhirMedicationRequests: Array<fhir.MedicationRequest>,
  repeatNumber: core.Interval<core.Timestamp>
) {
  const medicationListText = extractMedicationListText(fhirBundle, fhirCommunicationRequests)
  const patientInfoText = extractPatientInfoText(fhirCommunicationRequests)
  return fhirMedicationRequests.map((medicationRequest, index) => {
    const medicationListTextForLineItem = shouldIncludePatientAdditionalInstructions(index) ? medicationListText : []
    const patientInfoTextForLineItem = shouldIncludePatientAdditionalInstructions(index) ? patientInfoText : []
    const pertinentLineItem = convertMedicationRequestToLineItem(
      medicationRequest,
      repeatNumber,
      medicationListTextForLineItem,
      patientInfoTextForLineItem
    )
    return new prescriptions.PrescriptionPertinentInformation2(pertinentLineItem)
  })
}

function shouldIncludePatientAdditionalInstructions(lineItemIndex: number) {
  return lineItemIndex === 0
}

function convertPrescriptionPertinentInformation8() {
  //TODO - implement
  const tokenIssuedValue = new core.BooleanValue(false)
  const tokenIssued = new prescriptions.TokenIssued(tokenIssuedValue)
  return new prescriptions.PrescriptionPertinentInformation8(tokenIssued)
}

function convertPrescriptionPertinentInformation4(fhirFirstMedicationRequest: fhir.MedicationRequest) {
  const fhirMedicationPrescriptionTypeExtension = getExtensionForUrl(
    fhirFirstMedicationRequest.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType",
    "MedicationRequest.extension"
  ) as fhir.CodingExtension
  const prescriptionTypeValue = new codes.PrescriptionTypeCode(fhirMedicationPrescriptionTypeExtension.valueCoding.code)
  const prescriptionType = new prescriptions.PrescriptionType(prescriptionTypeValue)
  return new prescriptions.PrescriptionPertinentInformation4(prescriptionType)
}

function convertPerformer(performerReference: fhir.IdentifierReference<fhir.Organization>) {
  const hl7V3Organization = new peoplePlaces.Organization()
  hl7V3Organization.id = new codes.SdsOrganizationIdentifier(performerReference.identifier.value)
  const hl7V3AgentOrganization = new peoplePlaces.AgentOrganization(hl7V3Organization)
  return new prescriptions.Performer(hl7V3AgentOrganization)
}

export function convertRepeatNumber(
  medicationRequests: Array<fhir.MedicationRequest>
): Interval<NumericValue> {
  const courseOfTherapyTypeCode = getCourseOfTherapyTypeCode(medicationRequests)
  if (courseOfTherapyTypeCode === CourseOfTherapyTypeCode.CONTINUOUS) {
    return new Interval<NumericValue>(
      new NumericValue("1"),
      new NumericValue("1")
    )
  } else if (courseOfTherapyTypeCode === CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING) {
    const repeatNumberHighValue = extractRepeatNumberHighValue(medicationRequests[0])
    return new Interval<NumericValue>(
      new NumericValue("1"),
      new NumericValue(repeatNumberHighValue)
    )
  }
  return null
}

export function extractRepeatNumberHighValue(medicationRequest: fhir.MedicationRequest): string {
  const repeatInformationExtension = getExtensionForUrl(
    medicationRequest.extension,
    "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
    "MedicationRequest.extension"
  ) as fhir.RepeatInformationExtension

  const repeatNumberExtension = getExtensionForUrl(
    repeatInformationExtension.extension,
    "numberOfRepeatPrescriptionsAllowed",
    "MedicationRequest.extension.extension"
  ) as fhir.UnsignedIntExtension

  const repeatNumberExtensionValue = repeatNumberExtension.valueUnsignedInt
  return getNumericValueAsString(repeatNumberExtensionValue)
}

function convertPrescriptionPertinentInformation7(reviewDateStr: string) {
  const reviewDateTimestamp = convertIsoDateStringToHl7V3Date(
    reviewDateStr,
    "MedicationRequest.extension.extension.valueDateTime"
  )
  const reviewDate = new ReviewDate(reviewDateTimestamp)
  return new PrescriptionPertinentInformation7(reviewDate)
}

export function extractReviewDate(medicationRequest: fhir.MedicationRequest): string {
  const repeatInformationExtension = getExtensionForUrlOrNull(
    medicationRequest.extension,
    "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
    "MedicationRequest.extension"
  ) as fhir.RepeatInformationExtension
  if (!repeatInformationExtension) {
    return null
  }

  const reviewDateExtension = getExtensionForUrlOrNull(
    repeatInformationExtension.extension,
    "authorisationExpiryDate",
    "MedicationRequest.extension.extension"
  ) as fhir.DateTimeExtension
  if (!reviewDateExtension) {
    return null
  }

  return reviewDateExtension.valueDateTime
}
