import * as core from "../../model/hl7-v3-datatypes-core"
import {IntervalComplete, IntervalUnanchored, Timestamp} from "../../model/hl7-v3-datatypes-core"
import * as codes from "../../model/hl7-v3-datatypes-codes"
import * as prescriptions from "../../model/hl7-v3-prescriptions"
import {DaysSupply, PrescriptionPertinentInformation7, ReviewDate} from "../../model/hl7-v3-prescriptions"
import * as fhir from "../../model/fhir-resources"
import {DateTimeExtension, RepeatInformationExtension} from "../../model/fhir-resources"
import {
  convertIsoDateStringToMoment,
  convertIsoStringToHl7V3Date,
  convertMomentToHl7V3Date,
  getExtensionForUrl,
  getNumericValueAsString,
  onlyElement
} from "./common"
import {convertAuthor, convertResponsibleParty} from "./practitioner"
import * as peoplePlaces from "../../model/hl7-v3-people-places"
import {convertMedicationRequestToLineItem} from "./line-item"
import {getCommunicationRequests, getMedicationRequests} from "./common/getResourcesOfType"
import {getRepeatInformation, populateRepeatNumber} from "./common/repeatInformation"
import moment from "moment"

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
    hl7V3Prescription.performer = convertPerformer(fhirBundle, performer)
  }
  hl7V3Prescription.author = convertAuthor(fhirBundle, fhirFirstMedicationRequest)
  hl7V3Prescription.responsibleParty = convertResponsibleParty(fhirBundle, fhirFirstMedicationRequest)

  const validityPeriod = fhirFirstMedicationRequest.dispenseRequest.validityPeriod
  const expectedSupplyDuration = fhirFirstMedicationRequest.dispenseRequest.expectedSupplyDuration
  if (validityPeriod || expectedSupplyDuration) {
    hl7V3Prescription.component1 = convertPrescriptionComponent1(validityPeriod, expectedSupplyDuration)
  }

  const repeatInformation = getRepeatInformation(fhirMedicationRequests)
  if (repeatInformation.length) {
    hl7V3Prescription.pertinentInformation7 = convertPrescriptionPertinentInformation7(repeatInformation)
  }
  hl7V3Prescription.pertinentInformation5 = convertPrescriptionPertinentInformation5(fhirFirstMedicationRequest)
  hl7V3Prescription.pertinentInformation1 = convertPrescriptionPertinentInformation1(fhirFirstMedicationRequest)
  hl7V3Prescription.pertinentInformation2 = convertPrescriptionPertinentInformation2(fhirCommunicationRequest, fhirMedicationRequests)
  hl7V3Prescription.pertinentInformation8 = convertPrescriptionPertinentInformation8()
  hl7V3Prescription.pertinentInformation4 = convertPrescriptionPertinentInformation4(fhirFirstMedicationRequest)

  return hl7V3Prescription
}

function convertPrescriptionIds(
  fhirFirstMedicationRequest: fhir.MedicationRequest
): [codes.GlobalIdentifier, codes.ShortFormPrescriptionIdentifier] {
  const groupIdentifier = fhirFirstMedicationRequest.groupIdentifier
  const prescriptionIdExtension = getExtensionForUrl(groupIdentifier.extension, "https://fhir.nhs.uk/R4/StructureDefinition/Extension-PrescriptionId") as fhir.IdentifierExtension
  const prescriptionId = prescriptionIdExtension.valueIdentifier.value
  const prescriptionShortFormId = groupIdentifier.value
  return [
    new codes.GlobalIdentifier(prescriptionId),
    new codes.ShortFormPrescriptionIdentifier(prescriptionShortFormId)
  ]
}

function convertPrescriptionComponent1(validityPeriod: fhir.Period, expectedSupplyDuration: fhir.SimpleQuantity) {
  const daysSupply = new DaysSupply()
  if (validityPeriod) {
    const low = convertIsoStringToHl7V3Date(validityPeriod.start)
    const high = convertIsoStringToHl7V3Date(validityPeriod.end)
    daysSupply.effectiveTime = new IntervalComplete<Timestamp>(low, high)
  }
  if (expectedSupplyDuration) {
    const expectedSupplyDurationStr = getNumericValueAsString(expectedSupplyDuration.value)
    daysSupply.expectedUseTime = new IntervalUnanchored(expectedSupplyDurationStr, "d")
  }
  return new prescriptions.Component1(daysSupply)
}

function convertPrescriptionPertinentInformation7(repeatInformation: Array<RepeatInformationExtension>) {
  const nearestReviewDate = repeatInformation
    .map(repeatInformationExtension => getExtensionForUrl(repeatInformationExtension.extension, "authorisationExpiryDate") as DateTimeExtension)
    .map(dateTimeExtension => dateTimeExtension.valueDateTime)
    .map(convertIsoDateStringToMoment)
    .reduce((dateTime1, dateTime2) => moment.min(dateTime1, dateTime2))
  const nearestReviewDateStr = convertMomentToHl7V3Date(nearestReviewDate)
  const reviewDate = new ReviewDate(nearestReviewDateStr)
  return new PrescriptionPertinentInformation7(reviewDate)
}

function convertPrescriptionPertinentInformation5(fhirFirstMedicationRequest: fhir.MedicationRequest) {
  const prescriptionTreatmentType = convertCourseOfTherapyType(fhirFirstMedicationRequest)
  return new prescriptions.PrescriptionPertinentInformation5(prescriptionTreatmentType)
}

export function convertCourseOfTherapyType(fhirFirstMedicationRequest: fhir.MedicationRequest): prescriptions.PrescriptionTreatmentType {
  const courseOfTherapyTypeCode = fhirFirstMedicationRequest
    .courseOfTherapyType.coding.map(coding => coding.code)
    .reduce(onlyElement)

  const prescriptionTreatmentTypeCode = convertCourseOfTherapyTypeCode(courseOfTherapyTypeCode)
  return new prescriptions.PrescriptionTreatmentType(prescriptionTreatmentTypeCode)
}

function convertCourseOfTherapyTypeCode(courseOfTherapyTypeValue: string) {
  switch (courseOfTherapyTypeValue) {
  case "acute":
    return codes.PrescriptionTreatmentTypeCode.ACUTE
  case "continuous":
    return codes.PrescriptionTreatmentTypeCode.CONTINUOUS
  case "continuous-repeat-dispensing":
    return codes.PrescriptionTreatmentTypeCode.CONTINUOUS_REPEAT_DISPENSING
  default:
    throw TypeError("Unhandled courseOfTherapyType " + courseOfTherapyTypeValue)
  }
}

function convertPrescriptionPertinentInformation1(fhirFirstMedicationRequest: fhir.MedicationRequest) {
  const dispensingSitePreference = convertDispensingSitePreference(fhirFirstMedicationRequest)
  return new prescriptions.PrescriptionPertinentInformation1(dispensingSitePreference)
}

function convertDispensingSitePreference(fhirFirstMedicationRequest: fhir.MedicationRequest): prescriptions.DispensingSitePreference {
  const performerSiteType = getExtensionForUrl(fhirFirstMedicationRequest.dispenseRequest.extension, "https://fhir.nhs.uk/R4/StructureDefinition/Extension-performerSiteType") as fhir.CodingExtension
  const dispensingSitePreferenceValue = new codes.DispensingSitePreferenceCode(performerSiteType.valueCoding.code)
  return new prescriptions.DispensingSitePreference(dispensingSitePreferenceValue)
}

function isContentString(contentType: fhir.ContentString | fhir.ContentReference): contentType is fhir.ContentString {
  return (contentType as fhir.ContentString).contentString !== undefined
}

function formatPatientInfo(previousResult: string, newResult: string): string {
  return `${previousResult}<patientInfo>${newResult}</patientInfo>`
}

function createPatientInfoString(fhirCommunicationRequest: fhir.CommunicationRequest): string {
  return fhirCommunicationRequest.payload
    .filter(isContentString)
    .map(contentString => contentString.contentString)
    .reduce(formatPatientInfo, "")
}

function isFirstRequestAndCommunicationRequestPresent(request: number, fhirCommunicationRequest: Array<fhir.CommunicationRequest>) {
  return (request == 0 && fhirCommunicationRequest.length > 0)
}

function convertPrescriptionPertinentInformation2(fhirCommunicationRequest: Array<fhir.CommunicationRequest>,
  fhirMedicationRequests: Array<fhir.MedicationRequest>) {
  const pertinentInformation2 = []

  for (let i = 0; i < fhirMedicationRequests.length; i++) {
    const result = isFirstRequestAndCommunicationRequestPresent(i, fhirCommunicationRequest) ? createPatientInfoString(fhirCommunicationRequest[0]) : ""
    const pertinentLineItem = convertMedicationRequestToLineItem(fhirMedicationRequests[i], result)
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
  const fhirMedicationPrescriptionTypeExtension = getExtensionForUrl(fhirFirstMedicationRequest.extension, "https://fhir.nhs.uk/R4/StructureDefinition/Extension-prescriptionType") as fhir.CodingExtension
  const prescriptionTypeValue = new codes.PrescriptionTypeCode(fhirMedicationPrescriptionTypeExtension.valueCoding.code)
  const prescriptionType = new prescriptions.PrescriptionType(prescriptionTypeValue)
  return new prescriptions.PrescriptionPertinentInformation4(prescriptionType)
}

function convertPerformer(fhirBundle: fhir.Bundle, performerReference: fhir.IdentifierReference<fhir.Organization>) {
  const hl7V3Organization = new peoplePlaces.Organization()
  hl7V3Organization.id = new codes.SdsOrganizationIdentifier(performerReference.identifier.value)
  const hl7V3AgentOrganization = new peoplePlaces.AgentOrganization(hl7V3Organization)
  return new prescriptions.Performer(hl7V3AgentOrganization)
}
