import {fhir, hl7V3} from "@models"
import {
  getExtensionForUrl,
  getIdentifierValueForSystem,
  getIdentifierValueOrNullForSystem,
  getMessageId,
  getMedicationCoding,
  getExtensionForUrlOrNull
} from "../../common"
import {getMedicationDispenses, getMessageHeader, getPatientOrNull} from "../../common/getResourcesOfType"
import {convertIsoDateTimeStringToHl7V3DateTime, convertMomentToHl7V3DateTime} from "../../common/dateTime"
import pino from "pino"
import {createAgentPersonForUnattendedAccess} from "../agent-unattended"
import moment from "moment"
import {DispenseNotificationSupplyHeader} from "../../../../../../models/hl7-v3"
import {
  createAgentOrganisation,
  createDispenseNotificationSupplyHeaderPertinentInformation1,
  createPrescriptionId,
  createPertinentPrescriptionStatus,
  createOriginalPrescriptionRef,
  createPriorPrescriptionReleaseEventRef,
  getOrganisationPerformer,
  getRepeatNumberFromRepeatInfoExtension,
  isRepeatDispensing
} from "./dispense-common"

export async function convertDispenseNotification(
  bundle: fhir.Bundle,
  logger: pino.Logger
): Promise<hl7V3.DispenseNotification> {

  const messageId = getMessageId([bundle.identifier], "Bundle.identifier")

  const fhirHeader = getMessageHeader(bundle)
  const fhirPatient = getPatientOrNull(bundle)
  const fhirMedicationDispenses = getMedicationDispenses(bundle)
  const fhirFirstMedicationDispense = fhirMedicationDispenses[0]
  const fhirLineItemIdentifiers = getLineItemIdentifiers(fhirMedicationDispenses)

  //TODO - find out whether we need to handle user instead of organization (and what we do about org details if so)
  const fhirOrganisationPerformer = getOrganisationPerformer(fhirFirstMedicationDispense)
  const hl7AgentOrganisation = createAgentOrganisation(fhirOrganisationPerformer)
  const hl7Patient = createPatient(fhirPatient, fhirFirstMedicationDispense)
  const hl7CareRecordElementCategory = createCareRecordElementCategory(fhirLineItemIdentifiers)
  const hl7PriorMessageRef = createPriorMessageRef(fhirHeader)
  const hl7PriorPrescriptionReleaseEventRef = createPriorPrescriptionReleaseEventRef(fhirHeader)
  const hl7PertinentInformation1 = await createPertinentInformation1(
    bundle,
    messageId,
    fhirOrganisationPerformer,
    fhirMedicationDispenses,
    fhirFirstMedicationDispense,
    logger
  )

  const hl7DispenseNotification = new hl7V3.DispenseNotification(new hl7V3.GlobalIdentifier(messageId))
  hl7DispenseNotification.effectiveTime = convertMomentToHl7V3DateTime(moment.utc())
  hl7DispenseNotification.recordTarget = new hl7V3.RecordTargetReference(hl7Patient)
  hl7DispenseNotification.primaryInformationRecipient =
    new hl7V3.DispenseCommonPrimaryInformationRecipient(hl7AgentOrganisation)
  hl7DispenseNotification.pertinentInformation1 = hl7PertinentInformation1
  hl7DispenseNotification.pertinentInformation2 = new hl7V3.DispenseCommonPertinentInformation2(
    hl7CareRecordElementCategory
  )
  if (hl7PriorMessageRef) {
    hl7DispenseNotification.replacementOf = new hl7V3.ReplacementOf(hl7PriorMessageRef)
  }
  hl7DispenseNotification.sequelTo = new hl7V3.SequelTo(hl7PriorPrescriptionReleaseEventRef)

  return hl7DispenseNotification
}

async function createPertinentInformation1(
  bundle: fhir.Bundle,
  messageId: string,
  fhirOrganisation: fhir.DispensePerformer,
  fhirMedicationDispenses: Array<fhir.MedicationDispense>,
  fhirFirstMedicationDispense: fhir.MedicationDispense,
  logger: pino.Logger
) {
  const hl7RepresentedOrganisationCode = fhirOrganisation.actor.identifier.value
  const hl7AuthorTime = fhirFirstMedicationDispense.whenPrepared
  const hl7PertinentPrescriptionStatus = createPertinentPrescriptionStatus(fhirFirstMedicationDispense)
  const hl7PertinentPrescriptionIdentifier = createPrescriptionId(fhirFirstMedicationDispense)
  const hl7PriorOriginalRef = createOriginalPrescriptionRef(fhirFirstMedicationDispense)
  const hl7Author = await createAuthor(
    hl7RepresentedOrganisationCode,
    hl7AuthorTime,
    logger
  )
  const hl7PertinentInformation1LineItems = fhirMedicationDispenses.map(
    medicationDispense => {
      return createDispenseNotificationSupplyHeaderPertinentInformation1(
        medicationDispense,
        getMedicationCoding(bundle, medicationDispense),
        logger
      )
    }
  )
  const supplyHeader = new DispenseNotificationSupplyHeader(new hl7V3.GlobalIdentifier(messageId), hl7Author)
  supplyHeader.pertinentInformation1 = hl7PertinentInformation1LineItems
  supplyHeader.pertinentInformation3 = new hl7V3.SupplyHeaderPertinentInformation3(hl7PertinentPrescriptionStatus)
  supplyHeader.pertinentInformation4 = new hl7V3.SupplyHeaderPertinentInformation4(hl7PertinentPrescriptionIdentifier)
  supplyHeader.inFulfillmentOf = new hl7V3.InFulfillmentOf(hl7PriorOriginalRef)

  if (isRepeatDispensing(fhirFirstMedicationDispense)) {
    const repeatInfo = getExtensionForUrl(
      fhirFirstMedicationDispense.extension,
      "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation",
      "MedicationDispense.extension"
    ) as fhir.ExtensionExtension<fhir.IntegerExtension>

    supplyHeader.repeatNumber = getRepeatNumberFromRepeatInfoExtension(repeatInfo)
  }

  return new hl7V3.DispenseCommonPertinentInformation1(supplyHeader)
}

function getLineItemIdentifiers(fhirMedicationDispenses: Array<fhir.MedicationDispense>) {
  return fhirMedicationDispenses.map(medicationDispense =>
    getIdentifierValueForSystem(
      medicationDispense.identifier,
      "https://fhir.nhs.uk/Id/prescription-dispense-item-number",
      "MedicationDispense.identifier"
    )
  )
}

function getNhsNumber(fhirPatient: fhir.Patient, fhirFirstMedicationDispense: fhir.MedicationDispense) {
  return fhirPatient
    ? getIdentifierValueOrNullForSystem(
      fhirPatient.identifier,
      "https://fhir.nhs.uk/Id/nhs-number",
      "Patient.identifier.value")
    : fhirFirstMedicationDispense.subject.identifier.value
}

function createPatient(patient: fhir.Patient, firstMedicationDispense: fhir.MedicationDispense): hl7V3.Patient {
  const nhsNumber = getNhsNumber(patient, firstMedicationDispense)
  const hl7Patient = new hl7V3.Patient()
  hl7Patient.id = new hl7V3.NhsNumber(nhsNumber)
  return hl7Patient
}

async function createAuthor(
  organisationCode: string,
  authorTime: string,
  logger: pino.Logger
): Promise<hl7V3.PrescriptionAuthor> {
  const author = new hl7V3.PrescriptionAuthor()
  author.time = convertIsoDateTimeStringToHl7V3DateTime(authorTime, "MedicationDispense.whenPrepared")
  author.signatureText = hl7V3.Null.NOT_APPLICABLE
  author.AgentPerson = await createAgentPersonForUnattendedAccess(organisationCode, logger)
  return author
}

function createCareRecordElementCategory(fhirIdentifiers: Array<string>) {
  const hl7CareRecordElementCategory = new hl7V3.CareRecordElementCategory()
  hl7CareRecordElementCategory.component = fhirIdentifiers.map(
    fhirIdentifier => new hl7V3.CareRecordElementCategoryComponent(
      new hl7V3.ActRef({
        _attributes: {
          classCode: "SBADM",
          moodCode: "PRMS"
        },
        id: new hl7V3.GlobalIdentifier(fhirIdentifier)
      })
    )
  )
  return hl7CareRecordElementCategory
}

function createPriorMessageRef(fhirHeader: fhir.MessageHeader) {
  const replacementOf = getExtensionForUrlOrNull(
    fhirHeader.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-replacementOf",
    "MessageHeader.extension"
  ) as fhir.IdentifierExtension

  if (replacementOf) {
    return new hl7V3.MessageRef(new hl7V3.GlobalIdentifier(replacementOf.valueIdentifier.value))
  }
}
