import {
  getExtensionForUrl,
  getExtensionForUrlOrNull,
  getNumericValueAsString,
  isTruthy,
  resolveReference
} from "../common"
import {convertAuthor, convertResponsibleParty} from "./practitioner"
import {convertMedicationRequestToLineItem} from "./line-item"
import {getCommunicationRequests, getMedicationRequests} from "../common/getResourcesOfType"
import {getCourseOfTherapyTypeCode} from "./course-of-therapy-type"
import {InvalidValueError} from "../../../models/errors/processing-errors"
import {convertIsoDateStringToHl7V3Date, convertIsoDateTimeStringToHl7V3Date} from "../common/dateTime"
import * as hl7V3 from "../../../models/hl7-v3"
import * as fhir from "../../../models/fhir"

export function convertBundleToPrescription(bundle: fhir.Bundle): hl7V3.Prescription {
  const fhirMedicationRequests = getMedicationRequests(bundle)
  const fhirFirstMedicationRequest = fhirMedicationRequests[0]

  const fhirCommunicationRequests = getCommunicationRequests(bundle)

  const prescription = new hl7V3.Prescription(
    ...convertPrescriptionIds(fhirFirstMedicationRequest)
  )

  const repeatNumber = convertRepeatNumber(fhirMedicationRequests)
  if (repeatNumber) {
    prescription.repeatNumber = repeatNumber
  }

  const performer = fhirFirstMedicationRequest.dispenseRequest.performer
  if (performer) {
    prescription.performer = convertPerformer(performer)
  }

  prescription.author = convertAuthor(bundle, fhirFirstMedicationRequest)
  prescription.responsibleParty = convertResponsibleParty(bundle, fhirFirstMedicationRequest)

  if (getCourseOfTherapyTypeCode(fhirMedicationRequests)
    === fhir.CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING) {
    const validityPeriod = fhirFirstMedicationRequest.dispenseRequest.validityPeriod
    const expectedSupplyDuration = fhirFirstMedicationRequest.dispenseRequest.expectedSupplyDuration
    prescription.component1 = convertPrescriptionComponent1(validityPeriod, expectedSupplyDuration)
  }

  const reviewDate = extractReviewDate(fhirFirstMedicationRequest)
  if (reviewDate) {
    prescription.pertinentInformation7 = convertPrescriptionPertinentInformation7(reviewDate)
  }

  prescription.pertinentInformation5 = convertPrescriptionPertinentInformation5(fhirMedicationRequests)
  prescription.pertinentInformation1 = convertPrescriptionPertinentInformation1(fhirFirstMedicationRequest)
  prescription.pertinentInformation2 = convertPrescriptionPertinentInformation2(
    bundle,
    fhirCommunicationRequests,
    fhirMedicationRequests,
    repeatNumber
  )
  prescription.pertinentInformation8 = convertPrescriptionPertinentInformation8()
  prescription.pertinentInformation4 = convertPrescriptionPertinentInformation4(fhirFirstMedicationRequest)

  return prescription
}

function convertPrescriptionIds(
  fhirFirstMedicationRequest: fhir.MedicationRequest
): [hl7V3.GlobalIdentifier, hl7V3.ShortFormPrescriptionIdentifier] {
  const groupIdentifier = fhirFirstMedicationRequest.groupIdentifier
  const prescriptionIdExtension = getExtensionForUrl(
    groupIdentifier.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId",
    "MedicationRequest.groupIdentifier.extension"
  ) as fhir.IdentifierExtension
  const prescriptionId = prescriptionIdExtension.valueIdentifier.value
  const prescriptionShortFormId = groupIdentifier.value
  return [
    new hl7V3.GlobalIdentifier(prescriptionId),
    new hl7V3.ShortFormPrescriptionIdentifier(prescriptionShortFormId)
  ]
}

export function convertPrescriptionComponent1(
  validityPeriod: fhir.Period,
  expectedSupplyDuration: fhir.SimpleQuantity
): hl7V3.Component1 {
  const daysSupply = new hl7V3.DaysSupply()

  const low = convertIsoDateTimeStringToHl7V3Date(
    validityPeriod.start,
    "MedicationRequest.dispenseRequest.validityPeriod.start"
  )
  const high = convertIsoDateTimeStringToHl7V3Date(
    validityPeriod.end,
    "MedicationRequest.dispenseRequest.validityPeriod.end"
  )
  daysSupply.effectiveTime = new hl7V3.Interval<hl7V3.Timestamp>(low, high)

  if (expectedSupplyDuration.code !== "d") {
    throw new InvalidValueError(
      "Expected supply duration must be specified in days.",
      "MedicationRequest.dispenseRequest.expectedSupplyDuration.code"
    )
  }
  const expectedSupplyDurationStr = getNumericValueAsString(expectedSupplyDuration.value)
  daysSupply.expectedUseTime = new hl7V3.IntervalUnanchored(expectedSupplyDurationStr, "d")

  return new hl7V3.Component1(daysSupply)
}

function convertPrescriptionPertinentInformation5(
  fhirMedicationRequests: Array<fhir.MedicationRequest>
) {
  const prescriptionTreatmentType = convertCourseOfTherapyType(fhirMedicationRequests)
  return new hl7V3.PrescriptionPertinentInformation5(prescriptionTreatmentType)
}

export function convertCourseOfTherapyType(
  fhirMedicationRequests: Array<fhir.MedicationRequest>
): hl7V3.PrescriptionTreatmentType {
  const courseOfTherapyTypeCode = getCourseOfTherapyTypeCode(fhirMedicationRequests)
  const prescriptionTreatmentTypeCode = convertCourseOfTherapyTypeCode(courseOfTherapyTypeCode)
  return new hl7V3.PrescriptionTreatmentType(prescriptionTreatmentTypeCode)
}

function convertCourseOfTherapyTypeCode(courseOfTherapyTypeCode: string) {
  switch (courseOfTherapyTypeCode) {
    case fhir.CourseOfTherapyTypeCode.ACUTE:
      return hl7V3.PrescriptionTreatmentTypeCode.ACUTE
    case fhir.CourseOfTherapyTypeCode.CONTINUOUS:
      return hl7V3.PrescriptionTreatmentTypeCode.CONTINUOUS
    case fhir.CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING:
      return hl7V3.PrescriptionTreatmentTypeCode.CONTINUOUS_REPEAT_DISPENSING
    default:
      throw new InvalidValueError(
        `Unhandled course of therapy type code '${courseOfTherapyTypeCode}'.`,
        "MedicationRequest.courseOfTherapyType.coding.code"
      )
  }
}

function convertPrescriptionPertinentInformation1(fhirFirstMedicationRequest: fhir.MedicationRequest) {
  const dispensingSitePreference = convertDispensingSitePreference(fhirFirstMedicationRequest)
  return new hl7V3.PrescriptionPertinentInformation1(dispensingSitePreference)
}

function convertDispensingSitePreference(
  fhirFirstMedicationRequest: fhir.MedicationRequest
): hl7V3.DispensingSitePreference {
  const performerSiteType = getExtensionForUrl(
    fhirFirstMedicationRequest.dispenseRequest.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PerformerSiteType",
    "MedicationRequest.dispenseRequest.extension"
  ) as fhir.CodingExtension
  const dispensingSitePreferenceValue = new hl7V3.DispensingSitePreferenceCode(performerSiteType.valueCoding.code)
  return new hl7V3.DispensingSitePreference(dispensingSitePreferenceValue)
}

function extractPatientInfoText(
  fhirCommunicationRequests: Array<fhir.CommunicationRequest>
): Array<hl7V3.Text> {
  return fhirCommunicationRequests
    .flatMap(communicationRequest => communicationRequest.payload)
    .filter(isTruthy)
    .filter(fhir.isContentStringPayload)
    .map(payload => payload.contentString)
    .map(contentString => new hl7V3.Text(contentString))
}

function extractMedicationListText(
  bundle: fhir.Bundle,
  fhirCommunicationRequests: Array<fhir.CommunicationRequest>
): Array<hl7V3.Text> {
  return fhirCommunicationRequests
    .flatMap(communicationRequest => communicationRequest.payload)
    .filter(isTruthy)
    .filter(fhir.isContentReferencePayload)
    .map(payload => resolveReference(bundle, payload.contentReference))
    .flatMap(list => list.entry)
    .map(listEntry => listEntry?.item?.display)
    .filter(isTruthy)
    .map(display => new hl7V3.Text(display))
}

function convertPrescriptionPertinentInformation2(
  bundle: fhir.Bundle,
  fhirCommunicationRequests: Array<fhir.CommunicationRequest>,
  fhirMedicationRequests: Array<fhir.MedicationRequest>,
  repeatNumber: hl7V3.Interval<hl7V3.Timestamp>
) {
  const lineItems = []

  lineItems.push(convertMedicationRequestToLineItem(
    fhirMedicationRequests[0],
    repeatNumber,
    extractMedicationListText(bundle, fhirCommunicationRequests),
    extractPatientInfoText(fhirCommunicationRequests)
  ))

  for (let i=1; i<fhirMedicationRequests.length; i++) {
    lineItems.push(convertMedicationRequestToLineItem(
      fhirMedicationRequests[i],
      repeatNumber,
      [],
      []
    ))
  }

  return lineItems.map(pertinentLineItem => new hl7V3.PrescriptionPertinentInformation2(pertinentLineItem))
}

function convertPrescriptionPertinentInformation8() {
  //TODO - implement
  const tokenIssuedValue = new hl7V3.BooleanValue(false)
  const tokenIssued = new hl7V3.TokenIssued(tokenIssuedValue)
  return new hl7V3.PrescriptionPertinentInformation8(tokenIssued)
}

function convertPrescriptionPertinentInformation4(fhirFirstMedicationRequest: fhir.MedicationRequest) {
  const fhirMedicationPrescriptionTypeExtension = getExtensionForUrl(
    fhirFirstMedicationRequest.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType",
    "MedicationRequest.extension"
  ) as fhir.CodingExtension
  const prescriptionTypeValue = new hl7V3.PrescriptionTypeCode(fhirMedicationPrescriptionTypeExtension.valueCoding.code)
  const prescriptionType = new hl7V3.PrescriptionType(prescriptionTypeValue)
  return new hl7V3.PrescriptionPertinentInformation4(prescriptionType)
}

function convertPerformer(performerReference: fhir.IdentifierReference<fhir.Organization>) {
  const organization = new hl7V3.Organization()
  organization.id = new hl7V3.SdsOrganizationIdentifier(performerReference.identifier.value)
  const hl7V3AgentOrganization = new hl7V3.AgentOrganization(organization)
  return new hl7V3.Performer(hl7V3AgentOrganization)
}

export function convertRepeatNumber(
  medicationRequests: Array<fhir.MedicationRequest>
): hl7V3.Interval<hl7V3.NumericValue> {
  const courseOfTherapyTypeCode = getCourseOfTherapyTypeCode(medicationRequests)
  if (courseOfTherapyTypeCode === fhir.CourseOfTherapyTypeCode.CONTINUOUS) {
    return new hl7V3.Interval<hl7V3.NumericValue>(
      new hl7V3.NumericValue("1"),
      new hl7V3.NumericValue("1")
    )
  } else if (courseOfTherapyTypeCode === fhir.CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING) {
    const repeatNumberHighValue = extractRepeatNumberHighValue(medicationRequests[0])
    return new hl7V3.Interval<hl7V3.NumericValue>(
      new hl7V3.NumericValue("1"),
      new hl7V3.NumericValue(repeatNumberHighValue)
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
  const reviewDate = new hl7V3.ReviewDate(reviewDateTimestamp)
  return new hl7V3.PrescriptionPertinentInformation7(reviewDate)
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
