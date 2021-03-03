import * as hl7V3 from "../../../../models/hl7-v3"
import * as fhir from "../../../../models/fhir"
import {getIdentifierValueForSystem} from "../../common"
import {convertIsoDateTimeStringToHl7V3DateTime} from "../../common/dateTime"

export function convertDispenseNotification(bundle: fhir.Bundle): hl7V3.DispenseNotification {
  const messageId = getIdentifierValueForSystem(
    [bundle.identifier],
    "https://tools.ietf.org/html/rfc4122",
    "Bundle.identifier"
  )

  const dispenseNotification = new hl7V3.DispenseNotification(
    new hl7V3.GlobalIdentifier(messageId)
  )

  // todo: map from fhir/sds
  const fhirPatient = {
    identifier: [{
      system: "https://fhir.nhs.uk/Id/nhs-number",
      value: "9453740519"
    }]
  }
  const sdsIdentifier = "T1450"
  const organisationName = "NHS BUSINESS SERVICES AUTHORITY"
  // The globally unique identifier for this Dispense Notification clinical event.
  const prescriptionDispenseIdentifier = "D0CDE318-3260-428B-B8ED-E3C53B3C5089"
  // In this instance, this is the globally unique number (GUID) to identify either the
  // Patient Prescription Release Response or the Nominated Prescription Release Response
  // that authorised the Dispense event.
  const releaseResponseIdentifier = "450D738D-E5ED-48D6-A2A5-6EEEFA8BA689"
  const authorTime = "2004-09-16T16:30:00+00:00" // (MedicationDispense.whenPrepared, many to 1 mapping?)
  // ***********************

  const hl7V3Patient = new hl7V3.Patient()
  const nhsNumber = getIdentifierValueForSystem(
    fhirPatient.identifier,
    "https://fhir.nhs.uk/Id/nhs-number",
    "Patient.identifier"
  )
  hl7V3Patient.id = new hl7V3.NhsNumber(nhsNumber)
  dispenseNotification.recordTarget = new hl7V3.RecordTarget(hl7V3Patient)

  dispenseNotification.primaryInformationRecipient = new hl7V3.PrimaryInformationRecipient()
  const organization = new hl7V3.Organization()
  organization.id = new hl7V3.SdsOrganizationIdentifier(sdsIdentifier)
  organization.name = new hl7V3.Text(organisationName)
  dispenseNotification.primaryInformationRecipient.AgentOrg = new hl7V3.AgentOrganization(organization)
  const author = new hl7V3.Author()
  author.time = convertIsoDateTimeStringToHl7V3DateTime(authorTime, "MedicationDispense.whenPrepared")
  author.signatureText = hl7V3.Null.NOT_APPLICABLE
  const supplyHeader = new hl7V3.PertinentSupplyHeader(new hl7V3.Identifier(prescriptionDispenseIdentifier))
  supplyHeader.author = author
  dispenseNotification.pertinentInformation1 = new hl7V3.DispenseNotificationPertinentInformation1(supplyHeader)
  dispenseNotification.pertinentInformation2 = new hl7V3.DispenseNotificationPertinentInformation2(
    new hl7V3.CareRecordElementCategory()
  )
  dispenseNotification.sequelTo = new hl7V3.SequelTo(
    new hl7V3.PriorPrescriptionReleaseEventRef(
      new hl7V3.Identifier(releaseResponseIdentifier)
    )
  )

  return dispenseNotification
}
