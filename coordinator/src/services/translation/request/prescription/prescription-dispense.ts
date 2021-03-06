import * as hl7V3 from "../../../../models/hl7-v3"
import * as fhir from "../../../../models/fhir"
import {getExtensionForUrl, getIdentifierValueForSystem, onlyElement} from "../../common"
import {getMessageHeader, getResourcesOfType} from "../../common/getResourcesOfType"
import * as hl7v3 from "../../../../models/hl7-v3"
import moment from "moment"
import {convertIsoDateTimeStringToHl7V3DateTime, convertMomentToHl7V3DateTime} from "../../common/dateTime"

export function translateDispenseNotification(bundle: fhir.Bundle): hl7V3.DispenseNotification {
  const messageId = getIdentifierValueForSystem(
    [bundle.identifier],
    "https://tools.ietf.org/html/rfc4122",
    "Bundle.identifier"
  )

  const fhirFirstMedicationDispense = getResourcesOfType<fhir.MedicationDispense>(bundle, "MedicationDispense")[0]

  // todo: IMPORTANT this may also be in a separate Patient resource.
  // So the NHS number maybe in the MedicationDispense or Patient resource
  const hl7PatientId = fhirFirstMedicationDispense.subject.identifier.value

  const fhirAuthorizingPrescriptionExtensions =
    fhirFirstMedicationDispense.authorizingPrescription.flatMap(e => e.extension)
  const fhirGroupIdentifierExtension = getExtensionForUrl(
    fhirAuthorizingPrescriptionExtensions,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-GroupIdentifier",
    "MedicationDispense.authorizingPrescription") as fhir.ExtensionExtension<fhir.Extension>
  const fhirAuthorizingPrescriptionShortFormIdExtension = getExtensionForUrl(
    fhirGroupIdentifierExtension.extension,
    "shortForm",
    "MedicationDispense.authorizingPrescription.extension.valueIdentifier"
  ) as fhir.IdentifierExtension
  const hl7PertinentPrescriptionId =
    fhirAuthorizingPrescriptionShortFormIdExtension
      .valueIdentifier
      .value
  const fhirAuthorizingPrescriptionIdExtension = getExtensionForUrl(
    fhirGroupIdentifierExtension.extension,
    "UUID",
    "MedicationDispense.authorizingPrescription.extension.valueIdentifier"
  ) as fhir.IdentifierExtension
  const hl7PriorOriginalPrescriptionRef =
    fhirAuthorizingPrescriptionIdExtension
      .valueIdentifier
      .value
  const hl7PriorOriginalItemRef = getIdentifierValueForSystem(
    fhirFirstMedicationDispense.authorizingPrescription.map(e => e.identifier),
    "https://fhir.nhs.uk/Id/prescription-order-item-number",
    "MedicationDispense.authorizingPrescription.identifier"
  )

  const {
    hl7AgentOrganisationCode,
    hl7AgentOrganisationName,
    hl7RepresentedOrganisationCode,
    hl7RepresentedOrganisationName,
    hl7PriorPrescriptionReleaseEventRef
  } = extractHl7ValuesFromFhirMessageHeader(bundle)

  const hl7DispenseNotification = new hl7V3.DispenseNotification(new hl7V3.GlobalIdentifier(messageId))
  hl7DispenseNotification.effectiveTime = convertMomentToHl7V3DateTime(moment.utc())

  const hl7AuthorTime = fhirFirstMedicationDispense.whenPrepared // todo: validate same value?

  const fhirPractitionerPerformer = fhirFirstMedicationDispense.performer.find(p => p.actor.type === "Practitioner")
  const hl7AgentPersonPersonName = fhirPractitionerPerformer.actor.display

  const fhirMedicationDispenses = getResourcesOfType<fhir.MedicationDispense>(bundle, "MedicationDispense")

  const hl7Patient = getPatient(hl7PatientId)
  const hl7Organization = getOrganisation(hl7AgentOrganisationCode, hl7AgentOrganisationName)
  const hl7Author = getAuthor(
    hl7RepresentedOrganisationCode,
    hl7RepresentedOrganisationName,
    hl7AuthorTime,
    hl7AgentPersonPersonName
  )
  const hl7SupplyHeader = getSupplyHeader(
    messageId,
    hl7Author,
    fhirMedicationDispenses,
    hl7PertinentPrescriptionId,
    hl7PriorOriginalPrescriptionRef,
    hl7PriorOriginalItemRef
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
    )
  ]
  const pertinentInformation2 = new hl7V3.DispensePertinentInformation2(careRecordElementCategory)
  hl7DispenseNotification.pertinentInformation2 = pertinentInformation2
  hl7DispenseNotification.sequelTo = new hl7V3.SequelTo(
    new hl7V3.PriorPrescriptionReleaseEventRef(
      new hl7V3.GlobalIdentifier(hl7PriorPrescriptionReleaseEventRef)
    )
  )

  return hl7DispenseNotification
}

function extractHl7ValuesFromFhirMessageHeader(bundle: fhir.Bundle) {
  const fhirHeader = getMessageHeader(bundle)
  const fhirHeaderDestination = onlyElement(fhirHeader.destination, "MessageHeader.destination")
  const fhirHeaderSender = fhirHeader.sender
  const fhirHeaderResponse = fhirHeader.response

  const hl7AgentOrganisationCode = fhirHeaderDestination.receiver.identifier.value
  const hl7AgentOrganisationName = fhirHeaderDestination.receiver.display
  const hl7RepresentedOrganisationCode = fhirHeaderSender.identifier.value
  const hl7RepresentedOrganisationName = fhirHeaderSender.display
  const hl7PriorPrescriptionReleaseEventRef = fhirHeaderResponse.identifier

  return {
    hl7AgentOrganisationCode,
    hl7AgentOrganisationName,
    hl7RepresentedOrganisationCode,
    hl7RepresentedOrganisationName,
    hl7PriorPrescriptionReleaseEventRef
  }
}

function getPatient(nhsNumber: string) {
  const hl7Patient = new hl7V3.Patient()
  hl7Patient.id = new hl7V3.NhsNumber(nhsNumber)
  return hl7Patient
}

function getOrganisation(organisationCode: string, organisationName: string) {
  const organisation = new hl7V3.Organization()
  organisation.id = new hl7V3.SdsOrganizationIdentifier(organisationCode)
  organisation.code = new hl7V3.OrganizationTypeCode("999")
  organisation.name = new hl7V3.Text(organisationName)
  return organisation
}

function getAuthor(
  hl7RepresentedOrganisationCode: string,
  hl7RepresentedOrganisationName: string,
  hl7AuthorTime: string,
  hl7AgentPersonPersonName: string
) {
  const author = new hl7V3.Author()
  author.time = convertIsoDateTimeStringToHl7V3DateTime(hl7AuthorTime, "MedicationDispense.whenPrepared")
  author.signatureText = hl7V3.Null.NOT_APPLICABLE
  author.AgentPerson = getAgentPerson(
    hl7RepresentedOrganisationCode,
    hl7RepresentedOrganisationName,
    hl7AgentPersonPersonName)
  return author
}

function getAgentPerson(
  hl7RepresentedOrganisationCode: string,
  hl7RepresentedOrganisationName: string,
  hl7AgentPersonPersonName: string
) {
  const agentPerson = new hl7V3.AgentPerson()
  agentPerson.id = new hl7V3.SdsRoleProfileIdentifier("100243444980")
  agentPerson.code = new hl7V3.SdsJobRoleCode("R1290")
  agentPerson.telecom = [new hl7V3.Telecom(hl7V3.TelecomUse.WORKPLACE, "01208812760")]
  const agentPersonPerson = new hl7V3.AgentPersonPerson(new hl7V3.SdsUniqueIdentifier("687227875014"))
  const agentPersonPersonName = new hl7V3.Name()
  agentPersonPersonName._attributes = {use: hl7V3.NameUse.USUAL}
  agentPersonPersonName._text = hl7AgentPersonPersonName
  agentPersonPerson.name = agentPersonPersonName
  agentPerson.agentPerson = agentPersonPerson
  agentPerson.representedOrganization =
    getRepresentedOrganisation(hl7RepresentedOrganisationCode, hl7RepresentedOrganisationName)
  return agentPerson
}

function getRepresentedOrganisation(organisationCode: string, organisationName: string) {
  const organisation = getOrganisation(organisationCode, organisationName)
  organisation.id = new hl7V3.SdsOrganizationIdentifier("FH878")
  organisation.code = new hl7V3.OrganizationTypeCode("999")
  organisation.name = new hl7V3.Text(organisationName)
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
  messageId: string,
  hl7Author: hl7V3.Author,
  medicationDispenses: Array<fhir.MedicationDispense>,
  hl7AuthorizingPrescriptionShortFormId: string,
  hl7PriorOriginalPrescriptionRef: string,
  hl7PriorOriginalItemRef: string
) {
  const supplyHeader = new hl7V3.PertinentSupplyHeader(new hl7V3.GlobalIdentifier(messageId))
  supplyHeader.author = hl7Author
  supplyHeader.pertinentInformation1 = medicationDispenses.map(medicationDispense => {
    const fhirPrescriptionDispenseItemNumber = getIdentifierValueForSystem(
      medicationDispense.identifier,
      "https://fhir.nhs.uk/Id/prescription-dispense-item-number",
      "MedicationDispense.identifiers"
    )
    const fhirMedicationCodeableConceptCoding = onlyElement(
      medicationDispense.medicationCodeableConcept.coding,
      "MedicationDispense.medicationCodeableConcept.coding"
    )
    const fhirDosageInstruction = onlyElement(
      medicationDispense.dosageInstruction,
      "MedicationDispense.dosageInstruction"
    )

    const hl7SuppliedLineItemQuantitySnomedCode = new hl7V3.SnomedCode(
      medicationDispense.quantity.code,
      medicationDispense.quantity.unit
    )
    const hl7UnitValue = medicationDispense.quantity.value.toString()
    const hl7Quantity = new hl7V3.QuantityInAlternativeUnits(
      hl7UnitValue,
      hl7UnitValue,
      hl7SuppliedLineItemQuantitySnomedCode
    )
    const hl7ManufacturedSuppliedMaterialSnomedCode = new hl7V3.SnomedCode(
      fhirMedicationCodeableConceptCoding.code,
      fhirMedicationCodeableConceptCoding.display
    )
    const hl7PertinentSuppliedLineItem = new hl7V3.PertinentSuppliedLineItem(
      new hl7V3.GlobalIdentifier(fhirPrescriptionDispenseItemNumber),
      new hl7v3.SnomedCode(fhirMedicationCodeableConceptCoding.code),
    )
    const hl7Consumable = new hl7V3.Consumable()
    const hl7RequestedManufacturedProduct = new hl7V3.RequestedManufacturedProduct()
    const hl7SuppliedLineItemQuantity = new hl7V3.SuppliedLineItemQuantity()
    hl7PertinentSuppliedLineItem.consumable = hl7Consumable
    hl7SuppliedLineItemQuantity.code = hl7SuppliedLineItemQuantitySnomedCode
    hl7SuppliedLineItemQuantity.quantity = hl7Quantity
    hl7SuppliedLineItemQuantity.product = new hl7V3.DispenseProduct(
      new hl7V3.SuppliedManufacturedProduct(
        new hl7V3.ManufacturedRequestedMaterial(hl7ManufacturedSuppliedMaterialSnomedCode)
      )
    )
    hl7SuppliedLineItemQuantity.pertinentInformation1 = new hl7V3.DispenseLineItemPertinentInformation1(
      new hl7V3.PertinentSupplyInstructions(
        new hl7V3.Text(fhirDosageInstruction.text)
      )
    )
    const hl7Component = new hl7V3.DispenseLineItemComponent(hl7SuppliedLineItemQuantity)
    const hl7Component1 = new hl7V3.DispenseLineItemComponent1(
      new hl7V3.SupplyRequest(hl7SuppliedLineItemQuantitySnomedCode, hl7Quantity)
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
      new hl7V3.GlobalIdentifier(hl7PriorOriginalItemRef)
    )
    hl7PertinentSuppliedLineItem.inFulfillmentOf = hl7InFulfillmentOfLineItem
    hl7RequestedManufacturedProduct.manufacturedRequestedMaterial =
      new hl7V3.ManufacturedRequestedMaterial(hl7SuppliedLineItemQuantitySnomedCode)
    hl7Consumable.requestedManufacturedProduct = hl7RequestedManufacturedProduct
    return new hl7V3.DispenseNotificationPertinentInformation1LineItem(
      hl7PertinentSuppliedLineItem
    )
  })
  // https://fhir.nhs.uk/StructureDefinition/Extension-DM-prescriptionStatus
  supplyHeader.pertinentInformation3 = new hl7V3.DispensePertinentInformation3(
    new hl7V3.PertinentPrescriptionStatus(
      hl7V3.PrescriptionStatusCode.WITH_DISPENSER_ACTIVE // todo: map
    )
  )
  supplyHeader.pertinentInformation4 = new hl7V3.DispensePertinentInformation4(
    new hl7V3.PertinentPrescriptionId(new hl7V3.ShortFormPrescriptionIdentifier(hl7AuthorizingPrescriptionShortFormId))
  )
  supplyHeader.inFulfillmentOf = new hl7V3.InFulfillmentOf()
  supplyHeader.inFulfillmentOf.priorOriginalPrescriptionRef = new hl7V3.PriorOriginalRef(
    new hl7V3.GlobalIdentifier(hl7PriorOriginalPrescriptionRef)
  )
  return supplyHeader
}
