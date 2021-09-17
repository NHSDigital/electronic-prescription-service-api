import {fhir, hl7V3} from "@models"
import moment from "moment"
import pino from "pino"
import {GroupIdentifierExtension} from "../../../../../../models/fhir"
import {
  ChargePayment,
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
  getCodeableConceptCodingForSystemOrNull,
  getExtensionForUrl,
  getExtensionForUrlOrNull,
  getIdentifierValueForSystem,
  getMessageId,
  getNumericValueAsString,
  onlyElement
} from "../../common"
import {convertMomentToHl7V3DateTime} from "../../common/dateTime"
import {getClaim, getMessageHeader} from "../../common/getResourcesOfType"
import {createAgentPersonForUnattendedAccess} from "../agent-unattended"
import {createLineItemStatusCode, createOrganisation, createPriorPrescriptionReleaseEventRef} from "./dispense-common"
import {InvalidValueError} from "../../../../../../models/errors/processing-errors"

export async function convertDispenseClaimInformation(
  bundle: fhir.Bundle,
  logger: pino.Logger
): Promise<hl7V3.DispenseClaimInformation> {
  //TODO - possibly get rid of Bundle and MessageHeader and move everything to the Claim
  const messageId = getMessageId([bundle.identifier], "Bundle.identifier")
  const now = convertMomentToHl7V3DateTime(moment.utc())
  const dispenseClaimInformation = new hl7V3.DispenseClaimInformation(new hl7V3.GlobalIdentifier(messageId), now)

  const claim = getClaim(bundle)

  //TODO - validate that coverage is always NHS BSA
  const coverage = claim.insurance.coverage
  const organization = createOrganisation(coverage.identifier.value, coverage.display)
  const agentOrganization = new hl7V3.AgentOrganization(organization)
  dispenseClaimInformation.primaryInformationRecipient = new PrimaryInformationRecipient(agentOrganization)

  //TODO - receiver

  const item = onlyElement(claim.item, "Claim.item")
  dispenseClaimInformation.pertinentInformation1 = await createPertinentInformation1(
    claim,
    item,
    messageId,
    now,
    logger
  )

  //TODO - pertinentInformation2

  const messageHeader = getMessageHeader(bundle)
  const replacementOfExtension = getExtensionForUrlOrNull(
    messageHeader.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-replacementOf",
    "MessageHeader.extension"
  ) as fhir.IdentifierExtension
  if (replacementOfExtension) {
    const previousMessageId = new hl7V3.GlobalIdentifier(replacementOfExtension.valueIdentifier.value)
    const priorMessageRef = new hl7V3.MessageRef(previousMessageId)
    dispenseClaimInformation.replacementOf = new hl7V3.ReplacementOf(priorMessageRef)
  }

  const chargeExemptionCoding = getCodeableConceptCodingForSystemOrNull(
    item.programCode,
    "https://fhir.nhs.uk/CodeSystem/prescription-charge-exemption",
    "Claim.item.programCode"
  )
  if (chargeExemptionCoding) {
    const chargeExemptionCode = chargeExemptionCoding.code
    const chargeExempt = new hl7V3.ChargeExempt(isExemption(chargeExemptionCode), chargeExemptionCode)
    const evidenceSeenCoding = getCodeableConceptCodingForSystemOrNull(
      item.programCode,
      "https://fhir.nhs.uk/CodeSystem/DM-exemption-evidence",
      "Claim.item.detail.programCode"
    )
    if (evidenceSeenCoding) {
      const evidenceSeenCode = evidenceSeenCoding.code
      const evidenceSeen = new hl7V3.EvidenceSeen(isEvidenceSeen(evidenceSeenCode))
      chargeExempt.authorization = new hl7V3.Authorization(evidenceSeen)
    }
    dispenseClaimInformation.coverage = new hl7V3.Coverage(chargeExempt)
  }

  const hl7PriorPrescriptionReleaseEventRef = createPriorPrescriptionReleaseEventRef(messageHeader)
  dispenseClaimInformation.sequelTo = new hl7V3.SequelTo(hl7PriorPrescriptionReleaseEventRef)

  return dispenseClaimInformation
}

function isExemption(chargeExemptionCode: string) {
  //TODO - create enum?
  return chargeExemptionCode !== "0001"
}

function isEvidenceSeen(evidenceSeenCode: string) {
  //TODO - create enum?
  return evidenceSeenCode === "evidence-seen"
}

async function createPertinentInformation1(
  claim: fhir.Claim,
  item: fhir.ClaimItem,
  messageId: string,
  timestamp: Timestamp,
  logger: pino.Logger
) {
  //TODO - work out what this means and whether we're doing it:
  // "Note: this must refer to the last one in the series if more
  // than one dispense event was required to fulfil the prescription."
  const supplyHeader = new DispenseClaimSupplyHeader(new hl7V3.GlobalIdentifier(messageId))

  //TODO - repeat dispensing

  const payeeOdsCode = claim.payee.party.identifier.value
  //TODO - check that we can omit the user details (applies to all dispensing messages)
  const agentPerson = await createAgentPersonForUnattendedAccess(payeeOdsCode, logger)
  supplyHeader.legalAuthenticator = new LegalAuthenticator(timestamp, agentPerson)

  //TODO - populate pertinentInformation2 (non-dispensing reason)

  const prescriptionStatus = createPrescriptionStatus(item)
  supplyHeader.pertinentInformation3 = new hl7V3.SupplyHeaderPertinentInformation3(prescriptionStatus)

  supplyHeader.pertinentInformation1 = item.detail.map(detail => {
    const suppliedLineItem = createSuppliedLineItem(claim, item, detail)
    return new hl7V3.SupplyHeaderPertinentInformation1(suppliedLineItem)
  })

  const prescriptionId = createPrescriptionId(claim)
  supplyHeader.pertinentInformation4 = new hl7V3.SupplyHeaderPertinentInformation4(prescriptionId)

  const originalPrescriptionRef = createOriginalPrescriptionRef(claim)
  supplyHeader.inFulfillmentOf = new hl7V3.InFulfillmentOf(originalPrescriptionRef)

  return new hl7V3.DispenseCommonPertinentInformation1(supplyHeader)
}

function createPrescriptionStatus(item: fhir.ClaimItem) {
  const prescriptionStatusExtension = getExtensionForUrl(
    item.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-TaskBusinessStatus",
    "Claim.item.extension"
  ) as fhir.CodingExtension
  const prescriptionStatusCoding = prescriptionStatusExtension.valueCoding
  return new hl7V3.PrescriptionStatus(prescriptionStatusCoding.code, prescriptionStatusCoding.display)
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

export function createSuppliedLineItem(
  claim: fhir.Claim,
  item: fhir.ClaimItem,
  detail: fhir.ClaimItemDetail
): DispenseClaimSuppliedLineItem {
  //TODO - should this definitely be the dispense notification ID and not the line item ID?
  // and if so, should this be at subDetail level instead of claim/item/detail level?
  // and which dispense notification do we refer to if there are multiple for a given line item?
  const dispenseNotificationId = getIdentifierValueForSystem(
    claim.identifier,
    "https://fhir.nhs.uk/Id/prescription-dispense-item-number",
    "Claim.identifier"
  )

  const suppliedLineItem = new hl7V3.DispenseClaimSuppliedLineItem(
    new hl7V3.GlobalIdentifier(dispenseNotificationId)
  )
  suppliedLineItem.effectiveTime = hl7V3.Null.NOT_APPLICABLE
  //TODO - repeat dispensing
  suppliedLineItem.component = detail.subDetail.map(subDetail => {
    const hl7SuppliedLineItemQuantity = createSuppliedLineItemQuantity(claim, item, detail, subDetail)
    return new SuppliedLineItemComponent(hl7SuppliedLineItemQuantity)
  })

  const statusReasonExtension = getExtensionForUrlOrNull(
    detail.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-TaskBusinessStatusReason",
    "Claim.item.extension"
  ) as fhir.CodingExtension
  if (statusReasonExtension) {
    const nonDispensingReasonCode = statusReasonExtension.valueCoding.code
    const nonDispensingReason = new hl7V3.NonDispensingReason(nonDispensingReasonCode)
    suppliedLineItem.pertinentInformation2 = new SuppliedLineItemPertinentInformation2(nonDispensingReason)
  }

  const itemStatusExtension = getExtensionForUrl(
    detail.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-TaskBusinessStatus",
    "Claim.item.extension"
  ) as fhir.CodingExtension
  const hl7ItemStatusCode = createLineItemStatusCode(itemStatusExtension.valueCoding)
  suppliedLineItem.pertinentInformation3 = new hl7V3.SuppliedLineItemPertinentInformation3(
    new hl7V3.ItemStatus(hl7ItemStatusCode)
  )

  const hl7PriorOriginalItemRef = claim.prescription.identifier.value
  suppliedLineItem.inFulfillmentOf = new hl7V3.SuppliedLineItemInFulfillmentOf(
    new hl7V3.OriginalPrescriptionRef(new hl7V3.GlobalIdentifier(hl7PriorOriginalItemRef))
  )

  //TODO - predecessor

  return suppliedLineItem
}

export function createSuppliedLineItemQuantity(
  claim: fhir.Claim,
  item: fhir.ClaimItem,
  detail: fhir.ClaimItemDetail,
  subDetail: fhir.ClaimItemSubDetail
): DispenseClaimSuppliedLineItemQuantity {
  const fhirQuantity = subDetail.quantity
  const quantityUnitSnomedCode = new hl7V3.SnomedCode(fhirQuantity.code, fhirQuantity.unit)
  const quantityValue = getNumericValueAsString(fhirQuantity.value)
  const hl7Quantity = new hl7V3.QuantityInAlternativeUnits(quantityValue, quantityValue, quantityUnitSnomedCode)

  const fhirProductCoding = getCodeableConceptCodingForSystem(
    [subDetail.productOrService],
    "http://snomed.info/sct",
    "Claim.item.detail.productOrService"
  )
  const hl7ProductCoding = new hl7V3.SnomedCode(fhirProductCoding.code, fhirProductCoding.display)
  const manufacturedRequestedMaterial = new hl7V3.ManufacturedRequestedMaterial(hl7ProductCoding)
  const suppliedManufacturedProduct = new hl7V3.SuppliedManufacturedProduct(manufacturedRequestedMaterial)
  const dispenseProduct = new hl7V3.DispenseProduct(suppliedManufacturedProduct)

  const chargePaid = getChargePaid(subDetail)
  const chargePayment = new ChargePayment(chargePaid)
  const pertinentInformation1 = new hl7V3.DispenseClaimSuppliedLineItemQuantityPertinentInformation1(chargePayment)

  const endorsementCodings = getEndorsementCodings(subDetail)
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

function getChargePaid(subDetail: fhir.ClaimItemSubDetail) {
  const prescriptionChargeCoding = getCodeableConceptCodingForSystem(
    subDetail.programCode,
    "https://fhir.nhs.uk/CodeSystem/DM-prescription-charge",
    "Claim.item.detail.programCode"
  )
  switch (prescriptionChargeCoding.code) {
    //TODO - create enum?
    case "paid-once":
    case "paid-twice":
      return true
    case "not-paid":
      return false
    default:
      throw new InvalidValueError("Unsupported prescription charge code", "Claim.item.detail.programCode")
  }
}

function getEndorsementCodings(subDetail: fhir.ClaimItemSubDetail) {
  return subDetail.programCode
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
