import * as hl7V3 from "../../../../models/hl7-v3"
import * as fhir from "../../../../models/fhir"
import {getIdentifierValueForSystem} from "../../common"

export function convertDispenseNotification(
  bundle: fhir.Bundle): hl7V3.DispenseNotification {

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
  dispenseNotification.pertinentInformation1 = new hl7V3.DispenseNotificationPertinentInformation1()

  return dispenseNotification
}
