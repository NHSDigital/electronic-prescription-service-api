import * as hl7V3 from "../../../../models/hl7-v3"
import * as fhir from "../../../../models/fhir"
import {
  getCodingForSystem,
  getExtensionForUrl,
  getIdentifierValueForSystem,
  getIdentifierValueOrNullForSystem,
  onlyElement
} from "../../common"
import {
  getMedicationDispenses,
  getMessageHeader,
  getPatientOrNull
} from "../../common/getResourcesOfType"
import * as hl7v3 from "../../../../models/hl7-v3"
import moment from "moment"
import {convertIsoDateTimeStringToHl7V3DateTime, convertMomentToHl7V3DateTime} from "../../common/dateTime"

export function translateDispenseNotification(bundle: fhir.Bundle): hl7V3.DispenseNotification {
  const messageId = getMessageId(bundle)

  const fhirHeader = getMessageHeader(bundle)
  const fhirPatient = getPatientOrNull(bundle)
  const fhirMedicationDispenses = getMedicationDispenses(bundle)
  const fhirFirstMedicationDispense = fhirMedicationDispenses[0]
  const fhirIdentifiers = getIdentifiers(messageId, fhirMedicationDispenses)

  const hl7EffectiveTime = convertMomentToHl7V3DateTime(moment.utc())
  const hl7AgentOrganization = createAgentOrganisation(fhirHeader)
  const hl7Patient = createPatient(fhirPatient, fhirFirstMedicationDispense)
  const hl7CareRecordElementCategory = createCareRecordElementCategory(fhirIdentifiers)
  const hl7PriorPrescriptionReleaseEventRef = createPriorPrescriptionReleaseEventRef(fhirHeader)
  const hl7PertinentInformation1 = createPertinentInformation1(
    messageId,
    fhirHeader.sender,
    fhirMedicationDispenses,
    fhirFirstMedicationDispense
  )

  /* eslint-disable max-len */
  const hl7DispenseNotification = new hl7V3.DispenseNotification(new hl7V3.GlobalIdentifier(messageId))
  hl7DispenseNotification.effectiveTime = hl7EffectiveTime
  hl7DispenseNotification.recordTarget = new hl7V3.DispenseRecordTarget(hl7Patient)
  hl7DispenseNotification.primaryInformationRecipient = new hl7V3.PrimaryInformationRecipient(hl7AgentOrganization)
  hl7DispenseNotification.pertinentInformation1 = hl7PertinentInformation1
  hl7DispenseNotification.pertinentInformation2 = new hl7V3.DispensePertinentInformation2(hl7CareRecordElementCategory)
  hl7DispenseNotification.sequelTo = new hl7V3.SequelTo(hl7PriorPrescriptionReleaseEventRef)
  /* eslint-enable max-len */

  return hl7DispenseNotification
}

function createPertinentInformation1(
  messageId: string,
  fhirHeaderSender: fhir.IdentifierReference<fhir.Organization>,
  fhirMedicationDispenses: Array<fhir.MedicationDispense>,
  fhirFirstMedicationDispense: fhir.MedicationDispense
): hl7V3.DispenseNotificationPertinentInformation1 {

  const fhirPractitionerPerformer = fhirFirstMedicationDispense.performer.find(p => p.actor.type === "Practitioner")

  const hl7RepresentedOrganisationCode = fhirHeaderSender.identifier.value
  const hl7RepresentedOrganisationName = fhirHeaderSender.display
  const hl7AuthorTime = fhirFirstMedicationDispense.whenPrepared
  const hl7AgentPersonPersonName = fhirPractitionerPerformer.actor.display
  const hl7PertinentPrescriptionStatus = createPertinentPrescriptionStatus(fhirFirstMedicationDispense)
  const hl7PertinentPrescriptionIdentifier = createPertinentPrescriptionId(fhirFirstMedicationDispense)
  const hl7PriorOriginalRef = createPriorOriginalRef(fhirFirstMedicationDispense)
  const hl7Author = createAuthor(
    hl7RepresentedOrganisationCode,
    hl7RepresentedOrganisationName,
    hl7AuthorTime,
    hl7AgentPersonPersonName
  )
  const hl7PertinentInformation1LineItems = fhirMedicationDispenses.map(
    medicationDispense => createPertinentInformation1LineItem(medicationDispense)
  )

  /* eslint-disable max-len */
  const supplyHeader = new hl7V3.PertinentSupplyHeader(new hl7V3.GlobalIdentifier(messageId))
  supplyHeader.author = hl7Author
  supplyHeader.pertinentInformation1 = hl7PertinentInformation1LineItems
  supplyHeader.pertinentInformation3 = new hl7V3.DispensePertinentInformation3(hl7PertinentPrescriptionStatus)
  supplyHeader.pertinentInformation4 = new hl7V3.DispensePertinentInformation4(hl7PertinentPrescriptionIdentifier)
  supplyHeader.inFulfillmentOf = new hl7V3.InFulfillmentOf(hl7PriorOriginalRef)
  /* eslint-enable max-len */

  return new hl7V3.DispenseNotificationPertinentInformation1(supplyHeader)
}

function createPertinentInformation1LineItem(fhirMedicationDispense: fhir.MedicationDispense) {
  const hl7SuppliedLineItemQuantitySnomedCode = new hl7V3.SnomedCode(
    fhirMedicationDispense.quantity.code,
    fhirMedicationDispense.quantity.unit
  )
  const hl7UnitValue = fhirMedicationDispense.quantity.value.toString()
  const hl7Quantity = new hl7V3.QuantityInAlternativeUnits(
    hl7UnitValue,
    hl7UnitValue,
    hl7SuppliedLineItemQuantitySnomedCode
  )
  const fhirMedicationCodeableConceptCoding = getMedicationCodeableConceptCoding(fhirMedicationDispense)
  const hl7ManufacturedSuppliedMaterialSnomedCode = new hl7V3.SnomedCode(
    fhirMedicationCodeableConceptCoding.code,
    fhirMedicationCodeableConceptCoding.display
  )
  const fhirPrescriptionDispenseItemNumber = getPrescriptionItemNumber(fhirMedicationDispense)
  const hl7PertinentSuppliedLineItem = new hl7V3.PertinentSuppliedLineItem(
    new hl7V3.GlobalIdentifier(fhirPrescriptionDispenseItemNumber),
    new hl7v3.SnomedCode(fhirMedicationCodeableConceptCoding.code)
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
  const fhirDosageInstruction = getDosageInstruction(fhirMedicationDispense)
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
  const fhirPrescriptionLineItemStatus = getPrescriptionLineItemStatus(fhirMedicationDispense)
  const hl7ItemStatusCode = getLineItemStatusCode(fhirPrescriptionLineItemStatus)
  hl7PertinentSuppliedLineItem.pertinentInformation3 = new hl7V3.DispenseLineItemPertinentInformation3(
    new hl7V3.PertinentItemStatus(hl7ItemStatusCode)
  )
  const hl7PriorOriginalItemRef = getPrescriptionItemId(fhirMedicationDispense)
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
}

function getMessageId(bundle: fhir.Bundle) {
  return getIdentifierValueForSystem(
    [bundle.identifier],
    "https://tools.ietf.org/html/rfc4122",
    "Bundle.identifier"
  )
}

function getIdentifiers(
  messageId: string, fhirMedicationDispenses: Array<fhir.MedicationDispense>
): Array<string> {
  const fhirIdentifiers = [messageId]
  fhirMedicationDispenses.forEach(medicationDispense => {
    const fhirPrescriptionDispenseItemNumber = getIdentifierValueForSystem(
      medicationDispense.identifier,
      "https://fhir.nhs.uk/Id/prescription-dispense-item-number",
      "MedicationDispense.identifiers"
    )
    fhirIdentifiers.push(fhirPrescriptionDispenseItemNumber)
  })
  return fhirIdentifiers
}

function getNhsNumber(
  fhirPatient: fhir.Patient, fhirFirstMedicationDispense: fhir.MedicationDispense
): string {
  return fhirPatient
    ? getIdentifierValueOrNullForSystem(
      fhirPatient.identifier,
      "https://fhir.nhs.uk/Id/nhs-number",
      "Patient.identifier.value")
    : fhirFirstMedicationDispense.subject.identifier.value
}

export function getFhirGroupIdentifierExtension(
  fhirFirstMedicationDispense: fhir.MedicationDispense
): fhir.ExtensionExtension<fhir.Extension> {
  const fhirAuthorizingPrescriptionExtensions =
    fhirFirstMedicationDispense.authorizingPrescription.flatMap(e => e.extension)
  const fhirGroupIdentifierExtension = getExtensionForUrl(
    fhirAuthorizingPrescriptionExtensions,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-GroupIdentifier",
    "MedicationDispense.authorizingPrescription") as fhir.ExtensionExtension<fhir.Extension>
  return fhirGroupIdentifierExtension
}

export function getPrescriptionStatus(fhirFirstMedicationDispense: fhir.MedicationDispense): fhir.CodingExtension {
  return getExtensionForUrl(
    fhirFirstMedicationDispense.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-prescriptionStatus",
    "MedicationDispense.extension") as fhir.CodingExtension
}

function getPrescriptionItemId(fhirMedicationDispense: fhir.MedicationDispense): string {
  return getIdentifierValueForSystem(
    fhirMedicationDispense.authorizingPrescription.map(e => e.identifier),
    "https://fhir.nhs.uk/Id/prescription-order-item-number",
    "MedicationDispense.authorizingPrescription.identifier"
  )
}

function getDosageInstruction(fhirMedicationDispense: fhir.MedicationDispense): fhir.DosageInstruction {
  return onlyElement(
    fhirMedicationDispense.dosageInstruction,
    "MedicationDispense.dosageInstruction"
  )
}

function getMedicationCodeableConceptCoding(fhirMedicationDispense: fhir.MedicationDispense): fhir.Coding {
  return onlyElement(
    fhirMedicationDispense.medicationCodeableConcept.coding,
    "MedicationDispense.medicationCodeableConcept.coding"
  )
}

export function getPrescriptionItemNumber(fhirMedicationDispense: fhir.MedicationDispense): string {
  return getIdentifierValueForSystem(
    fhirMedicationDispense.identifier,
    "https://fhir.nhs.uk/Id/prescription-dispense-item-number",
    "MedicationDispense.identifier"
  )
}

function getPrescriptionLineItemStatus(fhirMedicationDispense: fhir.MedicationDispense): fhir.Coding {
  return getCodingForSystem(
    fhirMedicationDispense.type.coding,
    "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
    "MedicationDispense.type.coding"
  )
}

export function getLineItemStatusCode(fhirPrescriptionLineItemStatus: fhir.Coding): hl7V3.ItemStatusCode {
  const itemStatusCode = new hl7V3.ItemStatusCode(fhirPrescriptionLineItemStatus.code)
  itemStatusCode._attributes.displayName = fhirPrescriptionLineItemStatus.display
  return itemStatusCode
}

function createPertinentPrescriptionId(
  fhirFirstMedicationDispense: fhir.MedicationDispense
): hl7V3.PertinentPrescriptionId {
  const fhirGroupIdentifierExtension = getFhirGroupIdentifierExtension(fhirFirstMedicationDispense)
  const fhirAuthorizingPrescriptionShortFormIdExtension = getExtensionForUrl(
    fhirGroupIdentifierExtension.extension,
    "shortForm",
    "MedicationDispense.authorizingPrescription.extension.valueIdentifier"
  ) as fhir.IdentifierExtension
  const hl7PertinentPrescriptionId = fhirAuthorizingPrescriptionShortFormIdExtension
    .valueIdentifier
    .value
  return new hl7V3.PertinentPrescriptionId(new hl7V3.ShortFormPrescriptionIdentifier(hl7PertinentPrescriptionId))
}

function createPriorOriginalRef(firstMedicationDispense: fhir.MedicationDispense): hl7V3.PriorOriginalRef {
  const fhirGroupIdentifierExtension = getFhirGroupIdentifierExtension(firstMedicationDispense)
  const fhirAuthorizingPrescriptionShortFormIdExtension = getExtensionForUrl(
    fhirGroupIdentifierExtension.extension,
    "UUID",
    "MedicationDispense.authorizingPrescription.extension.valueIdentifier"
  ) as fhir.IdentifierExtension
  const id = fhirAuthorizingPrescriptionShortFormIdExtension.valueIdentifier.value
  return new hl7V3.PriorOriginalRef(
    new hl7V3.GlobalIdentifier(id)
  )
}

export function createPertinentPrescriptionStatus(
  fhirFirstMedicationDispense: fhir.MedicationDispense
): hl7V3.PertinentPrescriptionStatus {
  const fhirPrescriptionStatus = getPrescriptionStatus(fhirFirstMedicationDispense)
  const hl7StatusCode = new hl7V3.StatusCode(fhirPrescriptionStatus.valueCoding.code)
  hl7StatusCode._attributes.displayName = fhirPrescriptionStatus.valueCoding.display
  return new hl7V3.PertinentPrescriptionStatus(hl7StatusCode)
}

function createPatient(patient: fhir.Patient, firstMedicationDispense: fhir.MedicationDispense): hl7V3.Patient {
  const nhsNumber = getNhsNumber(patient, firstMedicationDispense)
  const hl7Patient = new hl7V3.Patient()
  hl7Patient.id = new hl7V3.NhsNumber(nhsNumber)
  return hl7Patient
}

function createAgentOrganisation(header: fhir.MessageHeader): hl7V3.AgentOrganization {
  const fhirHeaderDestination = onlyElement(header.destination, "MessageHeader.destination")
  const hl7OrganisationCode = fhirHeaderDestination.receiver.identifier.value
  const hl7OrganisationName = fhirHeaderDestination.receiver.display
  const hl7Organization = createOrganisation(hl7OrganisationCode, hl7OrganisationName)
  return new hl7V3.AgentOrganization(hl7Organization)
}

function createOrganisation(organisationCode: string, organisationName: string): hl7V3.Organization {
  const organisation = new hl7V3.Organization()
  organisation.id = new hl7V3.SdsOrganizationIdentifier(organisationCode)
  organisation.code = new hl7V3.OrganizationTypeCode("999") // todo: question if this should be hard-coded
  organisation.name = new hl7V3.Text(organisationName)
  return organisation
}

function createAuthor(
  hl7RepresentedOrganisationCode: string,
  hl7RepresentedOrganisationName: string,
  hl7AuthorTime: string,
  hl7AgentPersonPersonName: string
): hl7V3.Author {
  const author = new hl7V3.Author()
  author.time = convertIsoDateTimeStringToHl7V3DateTime(hl7AuthorTime, "MedicationDispense.whenPrepared")
  author.signatureText = hl7V3.Null.NOT_APPLICABLE
  author.AgentPerson = createAgentPerson(
    hl7RepresentedOrganisationCode,
    hl7RepresentedOrganisationName,
    hl7AgentPersonPersonName)
  return author
}

function createAgentPerson(
  organisationCode: string,
  organisationName: string,
  agentPersonPersonNameValue: string
): hl7V3.AgentPerson {
  const agentPerson = new hl7V3.AgentPerson()
  // todo dispenseNotification: ods/sds lookup
  agentPerson.id = new hl7V3.SdsRoleProfileIdentifier("100243444980")
  agentPerson.code = new hl7V3.SdsJobRoleCode(organisationCode)
  agentPerson.telecom = [new hl7V3.Telecom(hl7V3.TelecomUse.WORKPLACE, "01208812760")]
  const agentPersonPerson = new hl7V3.AgentPersonPerson(new hl7V3.SdsUniqueIdentifier("687227875014"))
  const agentPersonPersonName = new hl7V3.Name()
  agentPersonPersonName._attributes = {use: hl7V3.NameUse.USUAL}
  agentPersonPersonName._text = agentPersonPersonNameValue
  agentPersonPerson.name = agentPersonPersonName
  agentPerson.agentPerson = agentPersonPerson
  agentPerson.representedOrganization =
    createRepresentedOrganisation(organisationCode, organisationName)
  return agentPerson
}

function createRepresentedOrganisation(organisationCode: string, organisationName: string): hl7V3.Organization {
  const organisation = createOrganisation(organisationCode, organisationName)
  organisation.id = new hl7V3.SdsOrganizationIdentifier(organisationCode)
  // todo dispenseNotification: ods/sds lookup
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

function createPriorPrescriptionReleaseEventRef(fhirHeader: fhir.MessageHeader) {
  return new hl7V3.PriorPrescriptionReleaseEventRef(
    new hl7V3.GlobalIdentifier(fhirHeader.response.identifier)
  )
}
