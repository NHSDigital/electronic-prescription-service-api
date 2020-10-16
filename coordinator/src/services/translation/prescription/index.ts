import * as core from "../../../models/hl7-v3/hl7-v3-datatypes-core"
import {Interval, IntervalUnanchored, Timestamp} from "../../../models/hl7-v3/hl7-v3-datatypes-core"
import * as codes from "../../../models/hl7-v3/hl7-v3-datatypes-codes"
import * as prescriptions from "../../../models/hl7-v3/hl7-v3-prescriptions"
import {DaysSupply, PrescriptionPertinentInformation7, ReviewDate} from "../../../models/hl7-v3/hl7-v3-prescriptions"
import * as fhir from "../../../models/fhir/fhir-resources"
import {DateTimeExtension, RepeatInformationExtension} from "../../../models/fhir/fhir-resources"
import {
  convertIsoDateStringToMoment,
  convertIsoDateTimeStringToHl7V3Date,
  convertMomentToHl7V3Date,
  getExtensionForUrl,
  getExtensionForUrlOrNull,
  getNumericValueAsString
} from "../common"
import {convertAuthor, convertResponsibleParty} from "./practitioner"
import * as peoplePlaces from "../../../models/hl7-v3/hl7-v3-people-places"
import {convertMedicationRequestToLineItem} from "./line-item"
import {getCommunicationRequests, getMedicationRequests} from "../common/getResourcesOfType"
import {populateRepeatNumber} from "../common/repeatNumber"
import moment from "moment"
import {CourseOfTherapyTypeCode, getCourseOfTherapyTypeCode} from "./course-of-therapy-type"
import {InvalidValueError} from "../../../models/errors/processing-errors"

export function convertBundleToPrescription(fhirBundle: fhir.Bundle): prescriptions.Prescription {
  const fhirMedicationRequests = getMedicationRequests(fhirBundle)
  const fhirFirstMedicationRequest = fhirMedicationRequests[0]

  const fhirCommunicationRequest = getCommunicationRequests(fhirBundle)

  const hl7V3Prescription = new prescriptions.Prescription(
    ...convertPrescriptionIds(fhirFirstMedicationRequest)
  )

  populateRepeatNumber(hl7V3Prescription, fhirMedicationRequests)

  const performer = fhirFirstMedicationRequest.dispenseRequest.performer
  if (performer) {
    hl7V3Prescription.performer = convertPerformer(performer)
  }

  hl7V3Prescription.author = convertAuthor(fhirBundle, fhirFirstMedicationRequest, false)
  hl7V3Prescription.responsibleParty = convertResponsibleParty(fhirBundle, fhirFirstMedicationRequest, false)

  const validityPeriod = fhirFirstMedicationRequest.dispenseRequest.validityPeriod
  const expectedSupplyDuration = fhirFirstMedicationRequest.dispenseRequest.expectedSupplyDuration
  if (validityPeriod || expectedSupplyDuration) {
    hl7V3Prescription.component1 = convertPrescriptionComponent1(validityPeriod, expectedSupplyDuration)
  }

  populatePrescriptionPertinentInformation7(hl7V3Prescription, fhirMedicationRequests)

  hl7V3Prescription.pertinentInformation5 = convertPrescriptionPertinentInformation5(fhirMedicationRequests)
  hl7V3Prescription.pertinentInformation1 = convertPrescriptionPertinentInformation1(fhirFirstMedicationRequest)
  hl7V3Prescription.pertinentInformation2 = convertPrescriptionPertinentInformation2(
    fhirCommunicationRequest,
    fhirMedicationRequests
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
    "https://fhir.nhs.uk/R4/StructureDefinition/Extension-PrescriptionId",
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
  validityPeriod?: fhir.Period,
  expectedSupplyDuration?: fhir.SimpleQuantity
): prescriptions.Component1 {
  const daysSupply = new DaysSupply()
  if (validityPeriod) {
    const low = convertIsoDateTimeStringToHl7V3Date(
      validityPeriod.start,
      "MedicationRequest.dispenseRequest.validityPeriod.start"
    )
    const high = convertIsoDateTimeStringToHl7V3Date(
      validityPeriod.end,
      "MedicationRequest.dispenseRequest.validityPeriod.end"
    )
    daysSupply.effectiveTime = new Interval<Timestamp>(low, high)
  }
  if (expectedSupplyDuration) {
    if (expectedSupplyDuration.code !== "d") {
      throw new InvalidValueError(
        "Expected supply duration must be specified in days.",
        "MedicationRequest.dispenseRequest.expectedSupplyDuration.code"
      )
    }
    const expectedSupplyDurationStr = getNumericValueAsString(expectedSupplyDuration.value)
    daysSupply.expectedUseTime = new IntervalUnanchored(expectedSupplyDurationStr, "d")
  }
  return new prescriptions.Component1(daysSupply)
}

function populatePrescriptionPertinentInformation7(
  hl7V3Prescription: prescriptions.Prescription,
  medicationRequests: Array<fhir.MedicationRequest>
) {
  const nearestReviewDateTimestamp = convertNearestReviewDate(medicationRequests)
  if (nearestReviewDateTimestamp) {
    const reviewDate = new ReviewDate(nearestReviewDateTimestamp)
    hl7V3Prescription.pertinentInformation7 = new PrescriptionPertinentInformation7(reviewDate)
  }
}

export function convertNearestReviewDate(medicationRequests: Array<fhir.MedicationRequest>): Timestamp {
  const reviewDates = medicationRequests.map(extractReviewDate).filter(Boolean)
  if (!reviewDates.length) {
    return null
  }
  const nearestReviewDate = reviewDates.reduce((dateTime1, dateTime2) => moment.min(dateTime1, dateTime2))
  return convertMomentToHl7V3Date(nearestReviewDate)
}

function extractReviewDate(medicationRequest: fhir.MedicationRequest) {
  const repeatInformationExtension = getExtensionForUrlOrNull(
    medicationRequest.extension,
    "https://fhir.nhs.uk/R4/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
    "MedicationRequest.extension"
  ) as RepeatInformationExtension
  if (!repeatInformationExtension) {
    return null
  }

  const reviewDateExtension = getExtensionForUrlOrNull(
    repeatInformationExtension.extension,
    "authorisationExpiryDate",
    "MedicationRequest.extension.extension"
  ) as DateTimeExtension
  if (!reviewDateExtension) {
    return null
  }

  const reviewDateExtensionValue = reviewDateExtension.valueDateTime
  return convertIsoDateStringToMoment(
    reviewDateExtensionValue,
    "MedicationRequest.extension.extension.valueDateTime"
  )
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
    "https://fhir.nhs.uk/R4/StructureDefinition/Extension-performerSiteType",
    "MedicationRequest.dispenseRequest.extension"
  ) as fhir.CodingExtension
  const dispensingSitePreferenceValue = new codes.DispensingSitePreferenceCode(performerSiteType.valueCoding.code)
  return new prescriptions.DispensingSitePreference(dispensingSitePreferenceValue)
}

function extractText(fhirCommunicationRequests: Array<fhir.CommunicationRequest>): Array<core.Text> {
  return fhirCommunicationRequests
    .flatMap(communicationRequest => communicationRequest.payload)
    .map(contentString => new core.Text(contentString.contentString))
}

function isFirstRequestAndCommunicationRequestPresent(
  request: number,
  fhirCommunicationRequest: Array<fhir.CommunicationRequest>
) {
  return (request == 0 && fhirCommunicationRequest.length > 0)
}

function convertPrescriptionPertinentInformation2(fhirCommunicationRequests: Array<fhir.CommunicationRequest>,
  fhirMedicationRequests: Array<fhir.MedicationRequest>) {
  const pertinentInformation2 = []

  for (let i = 0; i < fhirMedicationRequests.length; i++) {
    const patientInfoText = isFirstRequestAndCommunicationRequestPresent(i, fhirCommunicationRequests)
      ? extractText(fhirCommunicationRequests)
      : []
    const pertinentLineItem = convertMedicationRequestToLineItem(fhirMedicationRequests[i], patientInfoText)
    pertinentInformation2.push(new prescriptions.PrescriptionPertinentInformation2(pertinentLineItem))
  }

  return pertinentInformation2
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
    "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-prescriptionType",
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
