import {fhir, hl7V3} from "@models"
import {
  getCodingForSystem,
  getExtensionForUrl,
  getExtensionForUrlOrNull,
  getIdentifierValueForSystem,
  getNumericValueAsString,
  onlyElement
} from "../../common"
import pino from "pino"
import {auditDoseToTextIfEnabled} from "../dosage"
import {SupplyHeaderPertinentInformation1} from "../../../../../../models/hl7-v3"
import {PersonOrOrganization} from "../../../../../../models/fhir"

//TODO - most of these methods aren't common - move them to dispense notification / claim as appropriate

export function createDispenseNotificationSupplyHeaderPertinentInformation1(
  fhirMedicationDispense: fhir.MedicationDispense,
  medicationCoding: fhir.Coding,
  logger: pino.Logger
): SupplyHeaderPertinentInformation1<hl7V3.DispenseNotificationSuppliedLineItem> {
  const fhirPrescriptionDispenseItemNumber = getPrescriptionItemNumber(fhirMedicationDispense)
  const fhirPrescriptionLineItemStatus = getPrescriptionLineItemStatus(fhirMedicationDispense)
  const fhirDosageInstruction = getDosageInstruction(fhirMedicationDispense, logger)

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
  const hl7ItemStatusCode = new hl7V3.ItemStatusCode(
    fhirPrescriptionLineItemStatus.code,
    fhirPrescriptionLineItemStatus.display
  )
  const hl7PriorOriginalItemRef = getPrescriptionItemId(fhirMedicationDispense)
  const hl7SuppliedLineItemQuantity = createSuppliedLineItemQuantity(
    hl7SuppliedLineItemQuantitySnomedCode,
    hl7Quantity,
    medicationCoding,
    fhirDosageInstruction
  )

  const hl7PertinentSuppliedLineItem = new hl7V3.DispenseNotificationSuppliedLineItem(
    new hl7V3.GlobalIdentifier(fhirPrescriptionDispenseItemNumber),
    new hl7V3.SnomedCode(medicationCoding.code)
  )
  hl7PertinentSuppliedLineItem.consumable = new hl7V3.Consumable(
    new hl7V3.RequestedManufacturedProduct(
      new hl7V3.ManufacturedRequestedMaterial(
        hl7SuppliedLineItemQuantitySnomedCode
      )
    )
  )
  hl7PertinentSuppliedLineItem.component = new hl7V3.SuppliedLineItemComponent(hl7SuppliedLineItemQuantity)
  hl7PertinentSuppliedLineItem.component1 = new hl7V3.SuppliedLineItemComponent1(
    new hl7V3.SupplyRequest(hl7SuppliedLineItemQuantitySnomedCode, hl7Quantity)
  )
  hl7PertinentSuppliedLineItem.pertinentInformation3 = new hl7V3.SuppliedLineItemPertinentInformation3(
    new hl7V3.ItemStatus(hl7ItemStatusCode)
  )
  hl7PertinentSuppliedLineItem.inFulfillmentOf = new hl7V3.SuppliedLineItemInFulfillmentOf(
    new hl7V3.OriginalPrescriptionRef(new hl7V3.GlobalIdentifier(hl7PriorOriginalItemRef))
  )

  if (isRepeatDispensing(fhirMedicationDispense)) {
    const repeatInfo = getExtensionForUrl(
      fhirMedicationDispense.extension,
      "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation",
      "MedicationDispense.extension"
    ) as fhir.ExtensionExtension<fhir.IntegerExtension>

    hl7PertinentSuppliedLineItem.repeatNumber = getRepeatNumberFromRepeatInfoExtension(repeatInfo)
  }

  return new hl7V3.SupplyHeaderPertinentInformation1(hl7PertinentSuppliedLineItem)
}

export function getRepeatNumberFromRepeatInfoExtension(
  repeatInfoExtension: fhir.ExtensionExtension<fhir.IntegerExtension>
): hl7V3.Interval<hl7V3.NumericValue> {
  const numberOfRepeatsIssuedExtension = getExtensionForUrl(
    repeatInfoExtension.extension,
    "numberOfRepeatsIssued",
    /* eslint-disable-next-line max-len */
    'MedicationDispense.extension("https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation").extension'
  ) as fhir.IntegerExtension
  const numberOfRepeatsIssued = getNumericValueAsString(numberOfRepeatsIssuedExtension.valueInteger)
  const numberOfRepeatsAllowedExtension = getExtensionForUrl(
    repeatInfoExtension.extension,
    "numberOfRepeatsAllowed",
    /* eslint-disable-next-line max-len */
    'MedicationDispense.extension("https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation").extension'
  ) as fhir.IntegerExtension
  const numberOfRepeatsAllowed = getNumericValueAsString(numberOfRepeatsAllowedExtension.valueInteger)

  return new hl7V3.Interval<hl7V3.NumericValue>(
    new hl7V3.NumericValue(numberOfRepeatsIssued),
    new hl7V3.NumericValue(numberOfRepeatsAllowed)
  )
}

export function createSuppliedLineItemQuantity(
  hl7SuppliedLineItemQuantitySnomedCode: hl7V3.SnomedCode,
  hl7Quantity: hl7V3.QuantityInAlternativeUnits,
  fhirMedicationCodeableConceptCoding: fhir.Coding,
  fhirDosageInstruction: fhir.Dosage
): hl7V3.DispenseNotificationSuppliedLineItemQuantity {
  const hl7SuppliedLineItemQuantity = new hl7V3.DispenseNotificationSuppliedLineItemQuantity()
  hl7SuppliedLineItemQuantity.code = hl7SuppliedLineItemQuantitySnomedCode
  hl7SuppliedLineItemQuantity.quantity = hl7Quantity
  hl7SuppliedLineItemQuantity.product = new hl7V3.DispenseProduct(
    new hl7V3.SuppliedManufacturedProduct(
      new hl7V3.ManufacturedRequestedMaterial(
        new hl7V3.SnomedCode(
          fhirMedicationCodeableConceptCoding.code,
          fhirMedicationCodeableConceptCoding.display
        )
      )
    )
  )
  // eslint-disable-next-line max-len
  hl7SuppliedLineItemQuantity.pertinentInformation1 = new hl7V3.DispenseNotificationSuppliedLineItemQuantityPertinentInformation1(
    new hl7V3.SupplyInstructions(fhirDosageInstruction.text)
  )
  return hl7SuppliedLineItemQuantity
}

export function getOrganisationPerformer(fhirFirstMedicationDispense: fhir.MedicationDispense): fhir.DispensePerformer {
  return fhirFirstMedicationDispense.performer.find(p => p.actor.type === "Organization")
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
    "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-TaskBusinessStatus",
    "MedicationDispense.extension") as fhir.CodingExtension
}

export function getPrescriptionItemId(fhirMedicationDispense: fhir.MedicationDispense): string {
  return getIdentifierValueForSystem(
    fhirMedicationDispense.authorizingPrescription.map(e => e.identifier),
    "https://fhir.nhs.uk/Id/prescription-order-item-number",
    "MedicationDispense.authorizingPrescription.identifier"
  )
}

export function getDosageInstruction(
  fhirMedicationDispense: fhir.MedicationDispense,
  logger: pino.Logger
): fhir.Dosage {
  auditDoseToTextIfEnabled(fhirMedicationDispense.dosageInstruction, logger)
  return onlyElement(
    fhirMedicationDispense.dosageInstruction,
    "MedicationDispense.dosageInstruction"
  )
}

export function getPrescriptionItemNumber(fhirMedicationDispense: fhir.MedicationDispense): string {
  return getIdentifierValueForSystem(
    fhirMedicationDispense.identifier,
    "https://fhir.nhs.uk/Id/prescription-dispense-item-number",
    "MedicationDispense.identifier"
  )
}

export function getPrescriptionLineItemStatus(fhirMedicationDispense: fhir.MedicationDispense): fhir.Coding {
  return getCodingForSystem(
    fhirMedicationDispense.type.coding,
    "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
    "MedicationDispense.type.coding"
  )
}

export function createPrescriptionId(
  fhirFirstMedicationDispense: fhir.MedicationDispense
): hl7V3.PrescriptionId {
  const fhirGroupIdentifierExtension = getFhirGroupIdentifierExtension(fhirFirstMedicationDispense)
  const fhirAuthorizingPrescriptionShortFormIdExtension = getExtensionForUrl(
    fhirGroupIdentifierExtension.extension,
    "shortForm",
    "MedicationDispense.authorizingPrescription.extension.valueIdentifier"
  ) as fhir.IdentifierExtension
  const hl7PertinentPrescriptionId = fhirAuthorizingPrescriptionShortFormIdExtension
    .valueIdentifier
    .value
  return new hl7V3.PrescriptionId(hl7PertinentPrescriptionId)
}

export function createOriginalPrescriptionRef(
  firstMedicationDispense: fhir.MedicationDispense
): hl7V3.OriginalPrescriptionRef {
  const fhirGroupIdentifierExtension = getFhirGroupIdentifierExtension(firstMedicationDispense)
  const fhirAuthorizingPrescriptionShortFormIdExtension = getExtensionForUrl(
    fhirGroupIdentifierExtension.extension,
    "UUID",
    "MedicationDispense.authorizingPrescription.extension.valueIdentifier"
  ) as fhir.IdentifierExtension
  const id = fhirAuthorizingPrescriptionShortFormIdExtension.valueIdentifier.value
  return new hl7V3.OriginalPrescriptionRef(
    new hl7V3.GlobalIdentifier(id)
  )
}

export function createPrescriptionStatus(
  fhirFirstMedicationDispense: fhir.MedicationDispense
): hl7V3.PrescriptionStatus {
  const prescriptionStatusExtension = getPrescriptionStatus(fhirFirstMedicationDispense)
  const prescriptionStatusCoding = prescriptionStatusExtension.valueCoding
  return new hl7V3.PrescriptionStatus(prescriptionStatusCoding.code, prescriptionStatusCoding.display)
}

export function createAgentOrganisation(
  organisation: fhir.DispensePerformer
): hl7V3.AgentOrganization {
  return createAgentOrganisationFromReference(organisation.actor)
}

export function createAgentOrganisationFromReference(
  reference: fhir.IdentifierReference<PersonOrOrganization>
): hl7V3.AgentOrganization {
  const organisationCode = reference.identifier.value
  const organisationName = reference.display
  const hl7Organisation = createOrganisation(organisationCode, organisationName)
  return new hl7V3.AgentOrganization(hl7Organisation)
}

export function createOrganisation(organisationCode: string, organisationName: string): hl7V3.Organization {
  const organisation = new hl7V3.Organization()
  organisation.id = new hl7V3.SdsOrganizationIdentifier(organisationCode)
  organisation.code = new hl7V3.OrganizationTypeCode()
  organisation.name = new hl7V3.Text(organisationName)
  return organisation
}

export function createPriorPrescriptionReleaseEventRef(
  fhirHeader: fhir.MessageHeader
): hl7V3.PriorPrescriptionReleaseEventRef {
  return new hl7V3.PriorPrescriptionReleaseEventRef(
    new hl7V3.GlobalIdentifier(fhirHeader.response.identifier)
  )
}

export function isRepeatDispensing(medicationDispense: fhir.MedicationDispense): boolean {
  return !!getExtensionForUrlOrNull(
    medicationDispense.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation",
    "MedicationDispense.extension"
  )
}
