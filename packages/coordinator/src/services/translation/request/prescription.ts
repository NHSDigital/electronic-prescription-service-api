import {
  getExtensionForUrl,
  getExtensionForUrlOrNull,
  getMedicationCoding,
  getNumericValueAsString,
  isTruthy,
  resolveReference
} from "../common"
import {convertAuthor, convertResponsibleParty} from "./practitioner"
import {convertMedicationRequestToLineItem} from "./line-item"
import {getCommunicationRequests, getMedicationRequests} from "../common/getResourcesOfType"
import {getCourseOfTherapyTypeCode} from "./course-of-therapy-type"
import {fhir, hl7V3, processingErrors as errors} from "@models"
import {convertIsoDateStringToHl7V3Date, convertIsoDateTimeStringToHl7V3Date, isFutureDated} from "../common/dateTime"
import pino from "pino"
import {LosslessNumber} from "lossless-json"

export function convertBundleToPrescription(bundle: fhir.Bundle, logger: pino.Logger): hl7V3.Prescription {
  const medicationRequests = getMedicationRequests(bundle)
  const firstMedicationRequest = medicationRequests[0]

  const communicationRequests = getCommunicationRequests(bundle)

  const prescription = new hl7V3.Prescription(
    ...convertPrescriptionIds(firstMedicationRequest)
  )

  const repeatNumber = convertRepeatNumber(medicationRequests)
  if (repeatNumber) {
    prescription.repeatNumber = repeatNumber
  }

  const performer = firstMedicationRequest.dispenseRequest.performer
  if (performer) {
    prescription.performer = convertPerformer(performer)
  }

  prescription.author = convertAuthor(bundle, firstMedicationRequest)
  prescription.responsibleParty = convertResponsibleParty(bundle, firstMedicationRequest)

  if (getCourseOfTherapyTypeCode(medicationRequests)
    === fhir.CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING) {
    const validityPeriod = firstMedicationRequest.dispenseRequest.validityPeriod
    const expectedSupplyDuration = firstMedicationRequest.dispenseRequest.expectedSupplyDuration
    prescription.component1 = convertPrescriptionComponent1(validityPeriod, expectedSupplyDuration)
  }

  const reviewDate = extractReviewDate(firstMedicationRequest)
  if (reviewDate) {
    prescription.pertinentInformation7 = convertPrescriptionPertinentInformation7(reviewDate)
  }

  prescription.pertinentInformation5 = convertPrescriptionPertinentInformation5(medicationRequests)
  prescription.pertinentInformation1 = convertPrescriptionPertinentInformation1(firstMedicationRequest)
  prescription.pertinentInformation2 = convertPrescriptionPertinentInformation2(
    bundle,
    communicationRequests,
    medicationRequests,
    repeatNumber,
    logger
  )
  prescription.pertinentInformation8 = convertPrescriptionPertinentInformation8()
  prescription.pertinentInformation4 = convertPrescriptionPertinentInformation4(firstMedicationRequest)

  return prescription
}

function convertPrescriptionIds(
  firstMedicationRequest: fhir.MedicationRequest
): [hl7V3.GlobalIdentifier, hl7V3.ShortFormPrescriptionIdentifier] {
  const groupIdentifier = firstMedicationRequest.groupIdentifier
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
    throw new errors.InvalidValueError(
      "Expected supply duration must be specified in days.",
      "MedicationRequest.dispenseRequest.expectedSupplyDuration.code"
    )
  }
  const expectedSupplyDurationStr = getNumericValueAsString(expectedSupplyDuration.value)
  daysSupply.expectedUseTime = new hl7V3.IntervalUnanchored(expectedSupplyDurationStr, "d")

  return new hl7V3.Component1(daysSupply)
}

function convertPrescriptionPertinentInformation5(
  medicationRequests: Array<fhir.MedicationRequest>
) {
  const prescriptionTreatmentType = convertCourseOfTherapyType(medicationRequests)
  return new hl7V3.PrescriptionPertinentInformation5(prescriptionTreatmentType)
}

export function convertCourseOfTherapyType(
  medicationRequests: Array<fhir.MedicationRequest>
): hl7V3.PrescriptionTreatmentType {
  const courseOfTherapyTypeCode = getCourseOfTherapyTypeCode(medicationRequests)
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
      throw new errors.InvalidValueError(
        `Unhandled course of therapy type code '${courseOfTherapyTypeCode}'.`,
        "MedicationRequest.courseOfTherapyType.coding.code"
      )
  }
}

function convertPrescriptionPertinentInformation1(firstMedicationRequest: fhir.MedicationRequest) {
  const dispensingSitePreference = convertDispensingSitePreference(firstMedicationRequest)
  return new hl7V3.PrescriptionPertinentInformation1(dispensingSitePreference)
}

function convertDispensingSitePreference(
  firstMedicationRequest: fhir.MedicationRequest
): hl7V3.DispensingSitePreference {
  const performerSiteType = getExtensionForUrl(
    firstMedicationRequest.dispenseRequest.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PerformerSiteType",
    "MedicationRequest.dispenseRequest.extension"
  ) as fhir.CodingExtension
  const dispensingSitePreferenceValue = new hl7V3.DispensingSitePreferenceCode(performerSiteType.valueCoding.code)
  return new hl7V3.DispensingSitePreference(dispensingSitePreferenceValue)
}

function extractPatientInfoText(
  communicationRequests: Array<fhir.CommunicationRequest>
): Array<hl7V3.Text> {
  return communicationRequests
    .flatMap(communicationRequest => communicationRequest.payload)
    .filter(isTruthy)
    .filter(fhir.isContentStringPayload)
    .map(payload => payload.contentString)
    .map(contentString => new hl7V3.Text(contentString))
}

function extractMedicationListText(
  bundle: fhir.Bundle,
  communicationRequests: Array<fhir.CommunicationRequest>
): Array<hl7V3.Text> {
  return communicationRequests
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
  communicationRequests: Array<fhir.CommunicationRequest>,
  medicationRequests: Array<fhir.MedicationRequest>,
  repeatNumber: hl7V3.Interval<hl7V3.Timestamp>,
  logger: pino.Logger
) {
  const lineItems = []

  lineItems.push(convertMedicationRequestToLineItem(
    medicationRequests[0],
    repeatNumber,
    extractMedicationListText(bundle, communicationRequests),
    extractPatientInfoText(communicationRequests),
    getMedicationCoding(bundle, medicationRequests[0]),
    logger
  ))

  for (let i = 1; i < medicationRequests.length; i++) {
    lineItems.push(convertMedicationRequestToLineItem(
      medicationRequests[i],
      repeatNumber,
      [],
      [],
      getMedicationCoding(bundle, medicationRequests[i]),
      logger
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

function convertPrescriptionPertinentInformation4(firstMedicationRequest: fhir.MedicationRequest) {
  const prescriptionTypeExtension = getExtensionForUrl(
    firstMedicationRequest.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType",
    "MedicationRequest.extension"
  ) as fhir.CodingExtension
  const prescriptionTypeValue = new hl7V3.PrescriptionTypeCode(prescriptionTypeExtension.valueCoding.code)
  const prescriptionType = new hl7V3.PrescriptionType(prescriptionTypeValue)
  return new hl7V3.PrescriptionPertinentInformation4(prescriptionType)
}

function convertPerformer(performerReference: fhir.IdentifierReference<fhir.Organization>) {
  const organization = new hl7V3.Organization()
  organization.id = new hl7V3.SdsOrganizationIdentifier(performerReference.identifier.value)
  const agentOrganization = new hl7V3.AgentOrganizationSDS(organization)
  return new hl7V3.PrescriptionPerformer(agentOrganization)
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
  const repeatNumberHighValueFromBasedOn = extractRepeatNumberHighValueFromBasedOn(medicationRequest)
  const repeatNumberHighValueFromDispenseRequest = extractRepeatNumberHighValueFromDispenseRequest(medicationRequest)

  if (!repeatNumberHighValueFromDispenseRequest) {
    throw new errors.InvalidValueError(
      "Number of repeats allowed is required.",
      "MedicationRequest.dispenseRequest.numberOfRepeatsAllowed"
    )
  }
  // Repeat number from basedOn is only going to be present in a repeat dispensing prescription at the verify-signature
  // step, when a fhir release-response is reverse-translated back into v3, in order to match the signature digest.
  return repeatNumberHighValueFromBasedOn ?? repeatNumberHighValueFromDispenseRequest
}

function extractRepeatNumberHighValueFromBasedOn(medicationRequest: fhir.MedicationRequest) {
  if (!medicationRequest.basedOn?.length) {
    return null
  }

  const repeatInformationExtension = getExtensionForUrlOrNull(
    medicationRequest.basedOn.flatMap(basedOn => basedOn.extension),
    "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation",
    "MedicationRequest.basedOn.extension"
  ) as fhir.EpsRepeatInformationExtension

  if (!repeatInformationExtension) {
    return null
  }

  const numberOfRepeatsAllowedExtension = getExtensionForUrlOrNull(
    repeatInformationExtension.extension,
    "numberOfRepeatsAllowed",
    "MedicationRequest.basedOn.extension.extension"
  ) as fhir.IntegerExtension

  if (!numberOfRepeatsAllowedExtension) {
    return null
  }

  const numberOfRepeatsAllowed = numberOfRepeatsAllowedExtension.valueInteger
  return parseNumberOfRepeatsAllowed(numberOfRepeatsAllowed)
}

function extractRepeatNumberHighValueFromDispenseRequest(medicationRequest: fhir.MedicationRequest) {
  const numberOfRepeatsAllowed = medicationRequest.dispenseRequest.numberOfRepeatsAllowed
  if (!numberOfRepeatsAllowed) {
    return undefined
  }
  return parseNumberOfRepeatsAllowed(numberOfRepeatsAllowed)
}

export function parseNumberOfRepeatsAllowed(numberOfRepeatsAllowed: string | LosslessNumber): string {
  let numberOfRepeatsAllowedNumber = typeof numberOfRepeatsAllowed === "string"
    ? parseInt(numberOfRepeatsAllowed)
    : numberOfRepeatsAllowed.valueOf()
  if (typeof numberOfRepeatsAllowedNumber === "bigint") {
    numberOfRepeatsAllowedNumber = Number(numberOfRepeatsAllowedNumber)
  }
  return numberOfRepeatsAllowedNumber.toString()
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
  ) as fhir.UkCoreRepeatInformationExtension
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

  const reviewDateString = reviewDateExtension.valueDateTime
  if (!isFutureDated(reviewDateString)) {
    throw new errors.InvalidValueError(`authorisationExpiryDate is not in the future '${reviewDateString}'.`)
  }

  return reviewDateString
}
