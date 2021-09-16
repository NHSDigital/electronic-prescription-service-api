import {fhir, hl7V3} from "@models"
import moment from "moment"
import pino from "pino"
import {GroupIdentifierExtension, PersonOrOrganization} from "../../../../../../models/fhir"
import {
  DispenseClaimChargePayment,
  DispenseClaimSuppliedLineItem,
  DispenseClaimSuppliedLineItemQuantity,
  DispenseClaimSupplyHeader,
  LegalAuthenticator,
  PrimaryInformationRecipient,
  SuppliedLineItemComponent,
  SuppliedLineItemPertinentInformation2,
  Timestamp
} from "../../../../../../models/hl7-v3"
import {
  getCodeableConceptCodingForSystem,
  getExtensionForUrl,
  getExtensionForUrlOrNull,
  getIdentifierValueForSystem,
  getMessageId,
  getNumericValueAsString
} from "../../common"
import {convertMomentToHl7V3DateTime} from "../../common/dateTime"
import {getClaims, getMessageHeader} from "../../common/getResourcesOfType"
import {createAgentPersonForUnattendedAccess} from "../agent-unattended"
import {
  createAgentOrganisationFromReference,
  createLineItemStatusCode,
  createPriorPrescriptionReleaseEventRef,
  getOrganisationPerformerFromClaim
} from "./dispense-common"
import {InvalidValueError} from "../../../../../../models/errors/processing-errors"

export async function convertDispenseClaimInformation(
  bundle: fhir.Bundle,
  logger: pino.Logger
): Promise<hl7V3.DispenseClaimInformation> {
  const messageId = getMessageId([bundle.identifier], "Bundle.identifier")
  const fhirHeader = getMessageHeader(bundle)

  const now = convertMomentToHl7V3DateTime(moment.utc())

  const hl7DispenseClaimInformation = new hl7V3.DispenseClaimInformation(
    new hl7V3.GlobalIdentifier(messageId),
    now
  )

  const claims = getClaims(bundle)
  const firstClaim = claims[0]

  const fhirOrganisationPerformer = getOrganisationPerformerFromClaim(firstClaim)
  const hl7PertinentInformation1 = await createPertinentInformation1(
    bundle,
    messageId,
    now,
    fhirOrganisationPerformer,
    claims,
    logger
  )

  hl7DispenseClaimInformation.pertinentInformation1 = hl7PertinentInformation1

  const hl7PriorPrescriptionReleaseEventRef = createPriorPrescriptionReleaseEventRef(fhirHeader)
  hl7DispenseClaimInformation.sequelTo = new hl7V3.SequelTo(hl7PriorPrescriptionReleaseEventRef)

  const hl7AgentOrganisation = createAgentOrganisationFromReference(fhirOrganisationPerformer)

  hl7DispenseClaimInformation.primaryInformationRecipient = new PrimaryInformationRecipient(hl7AgentOrganisation)

  return hl7DispenseClaimInformation
}

async function createPertinentInformation1(
  bundle: fhir.Bundle,
  messageId: string,
  timestamp: Timestamp,
  fhirOrganisation: fhir.IdentifierReference<PersonOrOrganization>,
  fhirClaims: Array<fhir.Claim>,
  logger: pino.Logger
) {
  const firstClaim = fhirClaims[0]

  const hl7RepresentedOrganisationCode = fhirOrganisation.identifier.value
  // TODO - Unattended access?
  const agentPerson = await createAgentPersonForUnattendedAccess(hl7RepresentedOrganisationCode, logger)
  const legalAuthenticator = new LegalAuthenticator(agentPerson, timestamp)
  //TODO - work out what this means and whether we're doing it:
  // "Note: this must refer to the last one in the series if more
  // than one dispense event was required to fulfil the prescription."
  const supplyHeader = new DispenseClaimSupplyHeader(new hl7V3.GlobalIdentifier(messageId))
  //TODO - repeat dispensing
  supplyHeader.legalAuthenticator = legalAuthenticator
  //TODO - populate legalAuthenticator.participant
  //TODO - populate pertinentInformation2 (non-dispensing reason)

  //TODO - ensure consistent prescription status for all items on all claims (should this even be at item level?)
  const prescriptionStatusExtension = getExtensionForUrl(
    firstClaim.item[0].extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-TaskBusinessStatus",
    "Claim.item.extension"
  ) as fhir.CodingExtension
  const hl7PertinentPrescriptionStatus = createPertinentPrescriptionStatusForClaim(
    prescriptionStatusExtension.valueCoding
  )
  supplyHeader.pertinentInformation3 = new hl7V3.SupplyHeaderPertinentInformation3(hl7PertinentPrescriptionStatus)

  supplyHeader.pertinentInformation1 = fhirClaims.map(createSupplyHeaderPertinentInformation1)

  //TODO - ensure consistent prescription id for all claims
  const prescriptionId = createPrescriptionId(firstClaim)
  supplyHeader.pertinentInformation4 = new hl7V3.SupplyHeaderPertinentInformation4(prescriptionId)

  //TODO - ensure consistent prescription id for all claims
  const originalPrescriptionRef = createOriginalPrescriptionRef(firstClaim)
  supplyHeader.inFulfillmentOf = new hl7V3.InFulfillmentOf(originalPrescriptionRef)

  return new hl7V3.DispenseCommonPertinentInformation1(supplyHeader)
}

export function createPertinentPrescriptionStatusForClaim(
  prescriptionStatus: fhir.Coding
): hl7V3.PertinentPrescriptionStatus {
  const hl7StatusCode = new hl7V3.StatusCode(prescriptionStatus.code)
  hl7StatusCode._attributes.displayName = prescriptionStatus.display
  return new hl7V3.PertinentPrescriptionStatus(hl7StatusCode)
}

export function createPrescriptionId(claim: fhir.Claim): hl7V3.PrescriptionId {
  const groupIdentifierExtension = getExtensionForUrl(
    claim.prescription.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-GroupIdentifier",
    "Claim.prescription.extension"
  ) as GroupIdentifierExtension

  const prescriptionShortFormIdExtension = getExtensionForUrl(
    groupIdentifierExtension.extension,
    "shortForm",
    "Claim.prescription.extension(\"https://fhir.nhs.uk/StructureDefinition/Extension-DM-GroupIdentifier\").extension"
  ) as fhir.IdentifierExtension

  const prescriptionShortFormId = prescriptionShortFormIdExtension.valueIdentifier.value
  return new hl7V3.PrescriptionId(prescriptionShortFormId)
}

export function createSupplyHeaderPertinentInformation1(
  claim: fhir.Claim
): hl7V3.SupplyHeaderPertinentInformation1<DispenseClaimSuppliedLineItem> {
  //TODO - should this definitely be the dispense notification ID and not the line item ID?
  // and if so, should this not be at item level instead of claim level?
  const dispenseNotificationId = getIdentifierValueForSystem(
    claim.identifier,
    "https://fhir.nhs.uk/Id/prescription-dispense-item-number",
    "Claim.identifier"
  )

  const hl7PertinentSuppliedLineItem = new hl7V3.DispenseClaimSuppliedLineItem(
    new hl7V3.GlobalIdentifier(dispenseNotificationId)
  )
  hl7PertinentSuppliedLineItem.effectiveTime = hl7V3.Null.NOT_APPLICABLE
  //TODO - repeat dispensing
  hl7PertinentSuppliedLineItem.component = claim.item.map(item => {
    return item.detail.map(itemDetail => {
      const hl7SuppliedLineItemQuantity = createSuppliedLineItemQuantity(claim, item, itemDetail)
      return new SuppliedLineItemComponent(hl7SuppliedLineItemQuantity)
    })
  }).flat()

  //TODO - this extension is at item level, but conceptually is at claim level
  // move it to claim?
  // enforce that all items have the same value?
  // use a particular instance (currently using the last, assuming that's most recent and so likely to be correct)?
  const statusReasonExtensions = claim.item.map(item =>
    getExtensionForUrlOrNull(
      item.extension,
      "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-TaskBusinessStatusReason",
      "Claim.item.extension"
    )
  ) as Array<fhir.CodingExtension>
  const mostRecentStatusReasonExtension = statusReasonExtensions.pop()
  if (mostRecentStatusReasonExtension) {
    const nonDispensingReasonCode = mostRecentStatusReasonExtension.valueCoding.code
    const nonDispensingReason = new hl7V3.NonDispensingReason(nonDispensingReasonCode)
    hl7PertinentSuppliedLineItem.pertinentInformation2 = new SuppliedLineItemPertinentInformation2(nonDispensingReason)
  }

  //TODO - this extension is at item level, but conceptually is at claim level - see above
  const itemStatusExtensions = claim.item.map(item =>
    getExtensionForUrl(
      item.extension,
      "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-TaskBusinessStatus",
      "Claim.item.extension"
    )
  ) as Array<fhir.CodingExtension>
  const mostRecentItemStatusExtension = itemStatusExtensions.pop()
  const hl7ItemStatusCode = createLineItemStatusCode(mostRecentItemStatusExtension.valueCoding)
  hl7PertinentSuppliedLineItem.pertinentInformation3 = new hl7V3.SuppliedLineItemPertinentInformation3(
    new hl7V3.PertinentItemStatus(hl7ItemStatusCode)
  )

  const hl7PriorOriginalItemRef = claim.prescription.identifier.value
  hl7PertinentSuppliedLineItem.inFulfillmentOf = new hl7V3.SuppliedLineItemInFulfillmentOf(
    new hl7V3.OriginalPrescriptionRef(new hl7V3.GlobalIdentifier(hl7PriorOriginalItemRef))
  )

  //TODO - predecessor

  return new hl7V3.SupplyHeaderPertinentInformation1(hl7PertinentSuppliedLineItem)
}

export function createSuppliedLineItemQuantity(
  claim: fhir.Claim,
  item: fhir.ClaimItem,
  itemDetail: fhir.ClaimItemDetail
): DispenseClaimSuppliedLineItemQuantity {
  const fhirQuantity = itemDetail.quantity
  const quantityUnitSnomedCode = new hl7V3.SnomedCode(fhirQuantity.code, fhirQuantity.unit)
  const quantityValue = getNumericValueAsString(fhirQuantity.value)
  const hl7Quantity = new hl7V3.QuantityInAlternativeUnits(quantityValue, quantityValue, quantityUnitSnomedCode)

  const fhirProductCoding = getCodeableConceptCodingForSystem(
    [itemDetail.productOrService],
    "http://snomed.info/sct",
    "Claim.item.detail.productOrService"
  )
  const hl7ProductCoding = new hl7V3.SnomedCode(fhirProductCoding.code, fhirProductCoding.display)
  const manufacturedRequestedMaterial = new hl7V3.ManufacturedRequestedMaterial(hl7ProductCoding)
  const suppliedManufacturedProduct = new hl7V3.SuppliedManufacturedProduct(manufacturedRequestedMaterial)
  const dispenseProduct = new hl7V3.DispenseProduct(suppliedManufacturedProduct)

  const chargePaid = getChargePaid(itemDetail)
  const chargePayment = new DispenseClaimChargePayment(chargePaid)
  const pertinentInformation1 = new hl7V3.DispenseClaimSuppliedLineItemQuantityPertinentInformation1(chargePayment)

  const endorsementCodings = getEndorsementCodings(itemDetail)
  const pertinentInformation2 = endorsementCodings.map(endorsementCoding => {
    const endorsement = createEndorsement(endorsementCoding)
    return new hl7V3.DispenseClaimSuppliedLineItemQuantityPertinentInformation2(endorsement)
  })

  return new hl7V3.DispenseClaimSuppliedLineItemQuantity(
    hl7Quantity,
    dispenseProduct,
    pertinentInformation1,
    pertinentInformation2
  )
}

function getChargePaid(itemDetail: fhir.ClaimItemDetail) {
  const prescriptionChargeCoding = getCodeableConceptCodingForSystem(
    itemDetail.programCode,
    "https://fhir.nhs.uk/CodeSystem/DM-prescription-charge",
    "Claim.item.detail.programCode"
  )
  switch (prescriptionChargeCoding.code) {
    case "paid-once":
      return true
    case "not-paid":
      return false
    default:
      throw new InvalidValueError("Unsupported prescription charge code", "Claim.item.detail.programCode")
  }
}

function getEndorsementCodings(itemDetail: fhir.ClaimItemDetail) {
  return itemDetail.programCode
    .flatMap(codeableConcept => codeableConcept.coding)
    .filter(coding => coding.system === "https://fhir.nhs.uk/CodeSystem/medicationdispense-endorsement")
}

function createEndorsement(endorsementCoding: fhir.Coding) {
  const endorsement = new hl7V3.DispensingEndorsement()
  //TODO - endorsement supporting information
  endorsement.value = new hl7V3.DispensingEndorsementCode(endorsementCoding.code)
  return endorsement
}

export function createOriginalPrescriptionRef(claim: fhir.Claim): hl7V3.OriginalPrescriptionRef {
  const groupIdentifierExtension = getGroupIdentifierExtension(claim)
  const prescriptionLongFormIdExtension = getExtensionForUrl(
    groupIdentifierExtension.extension,
    "UUID",
    "Claim.prescription.extension(\"https://fhir.nhs.uk/StructureDefinition/Extension-DM-GroupIdentifier\").extension"
  ) as fhir.IdentifierExtension

  const prescriptionLongFormId = prescriptionLongFormIdExtension.valueIdentifier.value
  return new hl7V3.OriginalPrescriptionRef(
    new hl7V3.GlobalIdentifier(prescriptionLongFormId)
  )
}

function getGroupIdentifierExtension(claim: fhir.Claim) {
  return getExtensionForUrl(
    claim.prescription.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-GroupIdentifier",
    "Claim.prescription.extension"
  )
}
