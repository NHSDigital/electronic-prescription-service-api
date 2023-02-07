import {fhir, hl7V3, processingErrors} from "@models"
import {
  getCodeableConceptCodingForSystem,
  getCodeableConceptCodingForSystemOrNull,
  getExtensionForUrl,
  getExtensionForUrlOrNull,
  getClaimIdentifierValue,
  getNumericValueAsString,
  onlyElement
} from "../../common"
import {createLegalAuthenticator} from "../agent-person"
import {createAgentOrganisationFromReference, getRepeatNumberFromRepeatInfoExtension} from "./dispense-common"
import {
  getContainedOrganizationViaReference,
  getContainedPractitionerRoleViaReference
} from "../../common/getResourcesOfType"
import {isReference} from "../../../../utils/type-guards"
import {convertIsoDateTimeStringToHl7V3DateTime} from "../../common/dateTime"

export function convertDispenseClaim(
  claim: fhir.Claim
): hl7V3.DispenseClaim {
  const messageId = getClaimIdentifierValue(claim)
  const claimDateTime = convertIsoDateTimeStringToHl7V3DateTime(claim.created, "Claim.created")
  const dispenseClaim = new hl7V3.DispenseClaim(new hl7V3.GlobalIdentifier(messageId), claimDateTime)

  //TODO - validate that coverage is always NHS BSA (preferably using the FHIR profile)
  const insurance = onlyElement(claim.insurance, "Claim.insurance")
  const agentOrganization = createAgentOrganisationFromReference(insurance.coverage)
  dispenseClaim.primaryInformationRecipient = new hl7V3.DispenseClaimPrimaryInformationRecipient(agentOrganization)

  const item = onlyElement(claim.item, "Claim.item")
  dispenseClaim.pertinentInformation1 = createDispenseClaimPertinentInformation1(
    claim,
    item,
    messageId
  )

  const replacementOfExtension = getExtensionForUrlOrNull(
    claim.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-replacementOf",
    "Claim.extension"
  ) as fhir.IdentifierExtension
  if (replacementOfExtension) {
    const previousMessageId = new hl7V3.GlobalIdentifier(replacementOfExtension.valueIdentifier.value)
    const priorMessageRef = new hl7V3.MessageRef(previousMessageId)
    dispenseClaim.replacementOf = new hl7V3.ReplacementOf(priorMessageRef)
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
      "Claim.item.programCode"
    )
    if (evidenceSeenCoding) {
      const evidenceSeenCode = evidenceSeenCoding.code
      const evidenceSeen = new hl7V3.EvidenceSeen(isEvidenceSeen(evidenceSeenCode))
      chargeExempt.authorization = new hl7V3.Authorization(evidenceSeen)
    }
    dispenseClaim.coverage = new hl7V3.Coverage(chargeExempt)
  }

  //This is mandatory but unused by BSA, so just populate it with a placeholder.
  const hl7PriorPrescriptionReleaseEventRef = new hl7V3.PriorPrescriptionReleaseEventRef(
    new hl7V3.GlobalIdentifier("ffffffff-ffff-4fff-bfff-ffffffffffff")
  )
  dispenseClaim.sequelTo = new hl7V3.SequelTo(hl7PriorPrescriptionReleaseEventRef)

  return dispenseClaim
}

function isExemption(chargeExemptionCode: string) {
  //TODO - create enum?
  return chargeExemptionCode !== "0001"
}

function isEvidenceSeen(evidenceSeenCode: string) {
  //TODO - create enum?
  return evidenceSeenCode === "evidence-seen"
}

function createDispenseClaimPertinentInformation1(
  claim: fhir.Claim,
  item: fhir.ClaimItem,
  messageId: string
) {
  const supplyHeader = new hl7V3.DispenseClaimSupplyHeader(new hl7V3.GlobalIdentifier(messageId))

  const repeatInfoExtension = getExtensionForUrlOrNull(
    item.detail[0].extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation",
    "Claim.item.detail.extension"
  ) as fhir.ExtensionExtension<fhir.IntegerExtension>
  if (repeatInfoExtension) {
    supplyHeader.repeatNumber = getRepeatNumberFromRepeatInfoExtension(
      repeatInfoExtension,
      "Claim.item.detail.extension"
    )
  }

  const practitionerRole = getContainedPractitionerRoleViaReference(
    claim,
    claim.provider.reference
  )

  if (!isReference(practitionerRole.organization)) {
    throw new processingErrors.InvalidValueError("practitioner.organization should be a reference",
      'Claim.contained("PractitionerRole").organization')
  }

  const organization = getContainedOrganizationViaReference(
    claim,
    practitionerRole.organization.reference
  )
  supplyHeader.legalAuthenticator = createLegalAuthenticator(
    practitionerRole,
    organization,
    claim.created
  )

  const nonDispensingReason = createNonDispensingReason(item)
  if (nonDispensingReason) {
    supplyHeader.pertinentInformation2 = new hl7V3.DispenseClaimSupplyHeaderPertinentInformation2(nonDispensingReason)
  }

  const prescriptionStatus = createPrescriptionStatus(item)
  supplyHeader.pertinentInformation3 = new hl7V3.SupplyHeaderPertinentInformation3(prescriptionStatus)

  supplyHeader.pertinentInformation1 = item.detail.map(detail => {
    const suppliedLineItem = createSuppliedLineItem(claim, item, detail)
    return new hl7V3.DispenseClaimSupplyHeaderPertinentInformation1(suppliedLineItem)
  })

  const prescriptionId = createPrescriptionId(claim)
  supplyHeader.pertinentInformation4 = new hl7V3.SupplyHeaderPertinentInformation4(prescriptionId)

  const originalPrescriptionRef = createOriginalPrescriptionRef(claim)
  supplyHeader.inFulfillmentOf = new hl7V3.InFulfillmentOf(originalPrescriptionRef)

  return new hl7V3.DispenseClaimPertinentInformation1(supplyHeader)
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

function createNonDispensingReason(item: fhir.ClaimItem) {
  const statusReason = getExtensionForUrlOrNull(
    item.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-TaskBusinessStatusReason",
    "Claim.item.extension"
  ) as fhir.CodingExtension

  if (!statusReason) return null

  const statusReasonCoding = statusReason.valueCoding
  return new hl7V3.NonDispensingReason(statusReasonCoding.code)
}

function createSuppliedLineItem(
  claim: fhir.Claim,
  item: fhir.ClaimItem,
  detail: fhir.ClaimItemDetail
): hl7V3.DispenseClaimSuppliedLineItem {
  const claimSequenceIdentifierExtension = getExtensionForUrl(
    detail.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-ClaimSequenceIdentifier",
    "Claim.item.detail.extension"
  ) as fhir.IdentifierExtension
  const suppliedLineItem = new hl7V3.DispenseClaimSuppliedLineItem(
    new hl7V3.GlobalIdentifier(claimSequenceIdentifierExtension.valueIdentifier.value)
  )
  suppliedLineItem.effectiveTime = hl7V3.Null.NOT_APPLICABLE

  const repeatInfoExtension = getExtensionForUrlOrNull(
    detail.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation",
    "Claim.item.detail.extension"
  ) as fhir.ExtensionExtension<fhir.IntegerExtension>
  if (repeatInfoExtension) {
    suppliedLineItem.repeatNumber = getRepeatNumberFromRepeatInfoExtension(
      repeatInfoExtension,
      "Claim.item.detail.extension"
    )
  }

  if (detail.subDetail?.length) {
    suppliedLineItem.component = detail.subDetail.map(subDetail => {
      const hl7SuppliedLineItemQuantity = createSuppliedLineItemQuantity(claim, item, detail, subDetail)
      return new hl7V3.DispenseClaimSuppliedLineItemComponent(hl7SuppliedLineItemQuantity)
    })
  }

  const statusReasonExtension = getExtensionForUrlOrNull(
    detail.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-TaskBusinessStatusReason",
    "Claim.item.detail.extension"
  ) as fhir.CodingExtension
  if (statusReasonExtension) {
    const nonDispensingReasonCode = statusReasonExtension.valueCoding.code
    const nonDispensingReason = new hl7V3.NonDispensingReason(nonDispensingReasonCode)
    suppliedLineItem.pertinentInformation2 = new hl7V3.SuppliedLineItemPertinentInformation2(nonDispensingReason)
  }

  const lineItemStatusCoding = getCodeableConceptCodingForSystem(
    detail.modifier,
    "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
    "Claim.item.detail.modifier"
  )
  const hl7ItemStatusCode = new hl7V3.ItemStatusCode(lineItemStatusCoding.code, lineItemStatusCoding.display)
  suppliedLineItem.pertinentInformation3 = new hl7V3.SuppliedLineItemPertinentInformation3(
    new hl7V3.ItemStatus(hl7ItemStatusCode)
  )

  const lineItemIdentifierExtension = getExtensionForUrl(
    detail.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-ClaimMedicationRequestReference",
    "Claim.item.detail.extension"
  ) as fhir.IdentifierReferenceExtension<fhir.MedicationRequest>
  const lineItemIdentifier = new hl7V3.GlobalIdentifier(lineItemIdentifierExtension.valueReference.identifier.value)
  const originalPrescriptionRef = new hl7V3.OriginalPrescriptionRef(lineItemIdentifier)
  suppliedLineItem.inFulfillmentOf = new hl7V3.SuppliedLineItemInFulfillmentOf(originalPrescriptionRef)

  return suppliedLineItem
}

function createSuppliedLineItemQuantity(
  claim: fhir.Claim,
  item: fhir.ClaimItem,
  detail: fhir.ClaimItemDetail,
  subDetail: fhir.ClaimItemSubDetail
): hl7V3.DispenseClaimSuppliedLineItemQuantity {
  const fhirQuantity = subDetail.quantity
  const quantityUnitSnomedCode = new hl7V3.SnomedCode(fhirQuantity.code, fhirQuantity.unit)
  const quantityValue = getNumericValueAsString(fhirQuantity.value)
  const hl7Quantity = new hl7V3.QuantityInAlternativeUnits(quantityValue, quantityValue, quantityUnitSnomedCode)

  const fhirProductCoding = getCodeableConceptCodingForSystem(
    [subDetail.productOrService],
    "http://snomed.info/sct",
    "Claim.item.detail.subDetail.productOrService"
  )
  const hl7ProductCoding = new hl7V3.SnomedCode(fhirProductCoding.code, fhirProductCoding.display)
  const manufacturedRequestedMaterial = new hl7V3.ManufacturedRequestedMaterial(hl7ProductCoding)
  const suppliedManufacturedProduct = new hl7V3.SuppliedManufacturedProduct(manufacturedRequestedMaterial)
  const dispenseProduct = new hl7V3.DispenseProduct(suppliedManufacturedProduct)

  const chargePaid = getChargePaid(detail)
  const chargePayment = new hl7V3.ChargePayment(chargePaid)
  const pertinentInformation1 = new hl7V3.DispenseClaimSuppliedLineItemQuantityPertinentInformation1(chargePayment)

  const endorsementCodeableConcepts = getEndorsementCodeableConcepts(detail)
  const pertinentInformation2 = endorsementCodeableConcepts.map(codeableConcept => {
    const endorsement = createEndorsement(codeableConcept)
    return new hl7V3.DispenseClaimSuppliedLineItemQuantityPertinentInformation2(endorsement)
  })

  return new hl7V3.DispenseClaimSuppliedLineItemQuantity(
    hl7Quantity,
    dispenseProduct,
    pertinentInformation1,
    pertinentInformation2
  )
}

function getChargePaid(detail: fhir.ClaimItemDetail) {
  const prescriptionChargeCoding = getCodeableConceptCodingForSystem(
    detail.programCode,
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
      throw new processingErrors.InvalidValueError(
        "Unsupported prescription charge code",
        "Claim.item.detail.programCode"
      )
  }
}

function getEndorsementCodeableConcepts(detail: fhir.ClaimItemDetail) {
  return detail.programCode.filter(codeableConcept =>
    codeableConcept.coding.find(coding =>
      coding.system === "https://fhir.nhs.uk/CodeSystem/medicationdispense-endorsement"
    )
  )
}

function createEndorsement(endorsementCodeableConcept: fhir.CodeableConcept) {
  const endorsementCoding = endorsementCodeableConcept.coding.find(coding =>
    coding.system === "https://fhir.nhs.uk/CodeSystem/medicationdispense-endorsement"
  )
  const endorsement = new hl7V3.DispensingEndorsement()
  const supportingInfo = endorsementCodeableConcept.text
  if (supportingInfo) {
    endorsement.text = supportingInfo
  }
  endorsement.value = new hl7V3.DispensingEndorsementCode(endorsementCoding.code)
  return endorsement
}

function createPrescriptionId(claim: fhir.Claim): hl7V3.PrescriptionId {
  const groupIdentifierExtension = getGroupIdentifierExtension(claim)
  const prescriptionShortFormIdExtension = getExtensionForUrl(
    groupIdentifierExtension.extension,
    "shortForm",
    "Claim.prescription.extension(\"https://fhir.nhs.uk/StructureDefinition/Extension-DM-GroupIdentifier\").extension"
  ) as fhir.IdentifierExtension

  const prescriptionShortFormId = prescriptionShortFormIdExtension.valueIdentifier.value
  return new hl7V3.PrescriptionId(prescriptionShortFormId)
}

function createOriginalPrescriptionRef(claim: fhir.Claim): hl7V3.OriginalPrescriptionRef {
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
