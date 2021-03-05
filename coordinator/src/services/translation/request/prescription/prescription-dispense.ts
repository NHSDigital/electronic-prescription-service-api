import * as hl7V3 from "../../../../models/hl7-v3"
import * as fhir from "../../../../models/fhir"
import {getIdentifierValueForSystem} from "../../common"
import {convertIsoDateTimeStringToHl7V3DateTime} from "../../common/dateTime"
import {MedicationDispense} from "../../../../models/fhir"
import {getResourcesOfType} from "../../common/getResourcesOfType"
import {SnomedCode} from "../../../../models/hl7-v3"

export function translateDispenseNotification(bundle: fhir.Bundle): hl7V3.DispenseNotification {
  const messageId = getIdentifierValueForSystem(
    [bundle.identifier],
    "https://tools.ietf.org/html/rfc4122",
    "Bundle.identifier"
  )

  const hl7DispenseNotification = new hl7V3.DispenseNotification(new hl7V3.GlobalIdentifier(messageId))
  hl7DispenseNotification.effectiveTime =
    convertIsoDateTimeStringToHl7V3DateTime("2020-03-05T10:59:00+00:00", "DispenseNotification.effectiveTime")

  // todo: map from fhir/sds
  const sds = getSDSDetails()
  const nhsNumber = "9401443157"
  const organisationName = "NHS BUSINESS SERVICES AUTHORITY"
  const pracitionerTelecom = "01208812760"
  const practitionerFamilyName = "WELSH"
  // The globally unique identifier for this Dispense Notification clinical event.
  const prescriptionDispenseIdentifier = "BE807DAC-9DCF-45CF-91D6-70D9D58DCF34"
  // In this instance, this is the globally unique number (GUID) to identify either the
  // Patient Prescription Release Response or the Nominated Prescription Release Response
  // that authorised the Dispense event.
  const releaseResponseIdentifier = "450D738D-E5ED-48D6-A2A5-6EEEFA8BA689"
  const authorTime = "2009-09-21T09:24:20+00:00" // (MedicationDispense.whenPrepared, many to 1 mapping?)
  // ***********************

  const fhirMedicationDispenses = getResourcesOfType<MedicationDispense>(bundle, "MedicationDispense")

  const hl7Patient = getPatient(nhsNumber)
  const hl7Organization = getOrganisation(sds.jobRoleCode, organisationName)
  const hl7Author = getAuthor(sds, authorTime, organisationName, pracitionerTelecom, practitionerFamilyName)
  const hl7SupplyHeader = getSupplyHeader(
    prescriptionDispenseIdentifier, hl7Author, fhirMedicationDispenses, releaseResponseIdentifier
  )
  hl7DispenseNotification.recordTarget = new hl7V3.DispenseRecordTarget(hl7Patient)
  hl7DispenseNotification.primaryInformationRecipient = new hl7V3.PrimaryInformationRecipient()
  hl7DispenseNotification.primaryInformationRecipient.AgentOrg = new hl7V3.AgentOrganization(hl7Organization)
  hl7DispenseNotification.pertinentInformation1 = new hl7V3.DispenseNotificationPertinentInformation1(hl7SupplyHeader)
  const careRecordElementCategory = new hl7V3.CareRecordElementCategory()
  careRecordElementCategory.component = [ // todo: map
    new hl7V3.CareRecordElementCategoryComponent(
      new hl7V3.ActRef({
        _attributes: {
          classCode: "SBADM",
          moodCode: "PRMS"
        },
        id: new hl7V3.GlobalIdentifier("450D738D-E5ED-48D6-A2A5-6EEEFA8BA689")
      })
    ),
    new hl7V3.CareRecordElementCategoryComponent(
      new hl7V3.ActRef({
        _attributes: {
          classCode: "SBADM",
          moodCode: "PRMS"
        },
        id: new hl7V3.GlobalIdentifier("450D738D-E5ED-48D6-A2A5-6EEEFA8BA689")
      })
    ),
    new hl7V3.CareRecordElementCategoryComponent(
      new hl7V3.ActRef({
        _attributes: {
          classCode: "SBADM",
          moodCode: "PRMS"
        },
        id: new hl7V3.GlobalIdentifier("450D738D-E5ED-48D6-A2A5-6EEEFA8BA689")
      })
    )
  ]
  const pertinentInformation2 = new hl7V3.DispensePertinentInformation2(careRecordElementCategory)
  hl7DispenseNotification.pertinentInformation2 = pertinentInformation2
  hl7DispenseNotification.sequelTo = new hl7V3.SequelTo(
    new hl7V3.PriorPrescriptionReleaseEventRef(
      new hl7V3.GlobalIdentifier(releaseResponseIdentifier)
    )
  )

  return hl7DispenseNotification
}

function getSDSDetails(): SDS {
  // todo: sync these to send-message-payload dispense version / work out diffs between orgs
  const sdsUniqueIdentifier = "687227875014"
  const sdsJobRoleCode = "R8003"
  const sdsRoleProfileIdentifier = "781733617547"
  return new SDS(sdsUniqueIdentifier, sdsJobRoleCode, sdsRoleProfileIdentifier)
}

class SDS {
  uniqueIdentifier: string
  jobRoleCode: string
  roleProfileIdentifier: string

  constructor(uniqueIdentifier: string, jobRoleCode: string, roleProfileIdentifier: string) {
    this.uniqueIdentifier = uniqueIdentifier
    this.jobRoleCode = jobRoleCode
    this.roleProfileIdentifier = roleProfileIdentifier
  }
}

function getPatient(nhsNumber: string) {
  const hl7Patient = new hl7V3.Patient()
  hl7Patient.id = new hl7V3.NhsNumber(nhsNumber)
  return hl7Patient
}

function getOrganisation(sdsJobRoleCode: string, organisationName?: string) {
  const organisation = new hl7V3.Organization()
  organisation.id = new hl7V3.SdsOrganizationIdentifier("T1450")
  if (organisationName) {
    organisation.name = new hl7V3.Text(organisationName)
  }
  return organisation
}

function getAuthor(
  sds: SDS, authorTime: string, organisationName: string, practitionerTelecom: string, practitionerName: string
) {
  const author = new hl7V3.Author()
  author.time = convertIsoDateTimeStringToHl7V3DateTime(authorTime, "MedicationDispense.whenPrepared")
  author.signatureText = hl7V3.Null.NOT_APPLICABLE
  author.AgentPerson = getAgentPerson(sds, organisationName, practitionerTelecom, practitionerName)
  return author
}

function getAgentPerson(
  sds: SDS, organisationName: string, pracitionerTelecom: string, practitionerFamilyName: string
) {
  const agentPerson = new hl7V3.AgentPerson()
  agentPerson.id = new hl7V3.SdsRoleProfileIdentifier("100243444980") // todo: figure out difference here
  agentPerson.code = new hl7V3.SdsJobRoleCode("R1290") // todo: figure out difference here
  agentPerson.telecom = [new hl7V3.Telecom(hl7V3.TelecomUse.WORKPLACE, pracitionerTelecom)]
  const agentPersonPerson = new hl7V3.AgentPersonPerson(new hl7V3.SdsUniqueIdentifier(sds.uniqueIdentifier))
  const agentPersonPersonName = new hl7V3.Name()
  agentPersonPersonName._attributes = {use: hl7V3.NameUse.USUAL}
  agentPersonPersonName._text = practitionerFamilyName
  agentPersonPerson.name = agentPersonPersonName
  agentPerson.agentPerson = agentPersonPerson
  agentPerson.representedOrganization = getRepresentedOrganisation(sds.jobRoleCode, organisationName)
  return agentPerson
}

function getRepresentedOrganisation(sdsJobRoleCode: string, organisationName: string) {
  const organisation = getOrganisation(sdsJobRoleCode, null)
  // todo: figure out the differences between orgs (represented and not)
  organisation.id = new hl7V3.SdsOrganizationIdentifier("FH878")
  organisation.code = new hl7V3.OrganizationTypeCode("999")
  organisation.name = new hl7V3.Text(organisationName || "BOOTS THE CHEMISTS LTD")
  organisation.telecom = new hl7V3.Telecom(hl7V3.TelecomUse.WORKPLACE, "01208812760")
  const hl7Address = new hl7V3.Address(hl7V3.AddressUse.WORK)
  hl7Address.streetAddressLine = [
    new hl7V3.Text("REGENCY ARCADE"),
    new hl7V3.Text("23 MOLESWORTH STREET"),
    new hl7V3.Text("WADEBRIDGE"),
    new hl7V3.Text("CORNWALL")
  ]
  hl7Address.postalCode = new hl7V3.Text("PL27 7DH")
  organisation.addr = hl7Address
  return organisation
}

function getSupplyHeader(
  prescriptionDispenseIdentifier: string,
  hl7Author: hl7V3.Author,
  medicationDispenses: Array<MedicationDispense>,
  releaseResponseIdentifier: string
) {
  const supplyHeader = new hl7V3.PertinentSupplyHeader(new hl7V3.GlobalIdentifier(prescriptionDispenseIdentifier))
  supplyHeader.author = hl7Author
  supplyHeader.pertinentInformation1 = medicationDispenses.map(medicationDispense => {
    const fhirMedicationDispenseIdentifier = medicationDispense.identifier[0].value
    const fhirMedicationCodeableConceptCoding = medicationDispense.medicationCodeableConcept.coding[0]
    const fhirSnomedCode = fhirMedicationCodeableConceptCoding.code
    const hl7SnomedCode = new hl7V3.SnomedCode(fhirSnomedCode)
    const hl7PertinentSuppliedLineItem = new hl7V3.PertinentSuppliedLineItem(
      new hl7V3.GlobalIdentifier(fhirMedicationDispenseIdentifier),
      new SnomedCode(fhirMedicationCodeableConceptCoding.code),
    )
    const hl7Consumable = new hl7V3.Consumable()
    const hl7RequestedManufacturedProduct = new hl7V3.RequestedManufacturedProduct()
    const hl7SuppliedLineItemQuantity = new hl7V3.SuppliedLineItemQuantity()
    hl7SnomedCode._attributes.displayName = "capsule"
    // todo: check this mapping, one should be the snomed dose, one should be dm+d?
    hl7SnomedCode._attributes.code = "3316911000001105"
    hl7PertinentSuppliedLineItem.consumable = hl7Consumable
    const fhirQuantity = medicationDispense.quantity
    const fhirQuantityValue = fhirQuantity.value.toString()
    //const fhirQuantityUnit = fhirQuantity.unit.toString() // todo: check this mapping
    const hl7Quantity = new hl7V3.QuantityInAlternativeUnits(fhirQuantityValue, fhirQuantityValue, hl7SnomedCode)
    hl7SuppliedLineItemQuantity.code = hl7SnomedCode
    hl7SuppliedLineItemQuantity.quantity = hl7Quantity
    hl7SuppliedLineItemQuantity.product = new hl7V3.DispenseProduct(
      new hl7V3.SuppliedManufacturedProduct(new hl7V3.ManufacturedRequestedMaterial(hl7SnomedCode))
    )
    hl7SuppliedLineItemQuantity.pertinentInformation1 = new hl7V3.DispenseLineItemPertinentInformation1(
      new hl7V3.PertinentSupplyInstructions(new hl7V3.Text("As directed")) // todo: actual mapping
    )
    const hl7Component = new hl7V3.DispenseLineItemComponent(hl7SuppliedLineItemQuantity)
    const hl7Component1 = new hl7V3.DispenseLineItemComponent1(
      new hl7V3.SupplyRequest(hl7SnomedCode, hl7Quantity)
    )
    hl7PertinentSuppliedLineItem.component = hl7Component
    hl7PertinentSuppliedLineItem.component1 = hl7Component1
    hl7PertinentSuppliedLineItem.pertinentInformation3 = new hl7V3.DispenseLineItemPertinentInformation3(
      new hl7V3.PertinentItemStatus(
        hl7V3.ItemStatusCode.DISPENSED_PARTIAL // todo: map
      )
    )
    const hl7InFulfillmentOfLineItem = new hl7V3.InFulfillmentOfLineItem()
    hl7InFulfillmentOfLineItem.priorOriginalItemRef = new hl7V3.PriorOriginalRef(
      // todo: should this be lineItem of MedicationRequest identifier?
      new hl7V3.GlobalIdentifier(releaseResponseIdentifier)
    )
    hl7PertinentSuppliedLineItem.inFulfillmentOf = hl7InFulfillmentOfLineItem
    hl7RequestedManufacturedProduct.manufacturedRequestedMaterial =
      new hl7V3.ManufacturedRequestedMaterial(hl7SnomedCode)
    hl7Consumable.requestedManufacturedProduct = hl7RequestedManufacturedProduct
    return new hl7V3.DispenseNotificationPertinentInformation1LineItem(
      hl7PertinentSuppliedLineItem
    )
  })
  supplyHeader.pertinentInformation3 = new hl7V3.DispensePertinentInformation3(
    new hl7V3.PertinentPrescriptionStatus(
      hl7V3.PrescriptionStatusCode.WITH_DISPENSER_ACTIVE // todo: map
    )
  )
  supplyHeader.pertinentInformation4 = new hl7V3.DispensePertinentInformation4(
    new hl7V3.PertinentPrescriptionId(new hl7V3.ShortFormPrescriptionIdentifier("3C2366-B81001-0A409U")) // todo: map
  )
  supplyHeader.inFulfillmentOf = new hl7V3.InFulfillmentOf()
  supplyHeader.inFulfillmentOf.priorOriginalPrescriptionRef = new hl7V3.PriorOriginalRef(
    new hl7V3.GlobalIdentifier(releaseResponseIdentifier)
  )
  return supplyHeader
}
