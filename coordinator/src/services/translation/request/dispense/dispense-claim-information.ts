import {fhir, hl7V3} from "@models"
import moment from "moment"
import pino from "pino"
import {PersonOrOrganization} from "../../../../../../models/fhir"
import {
  DispenseClaimChargePayment,
  DispenseClaimLineItemComponent,
  DispenseClaimLineItemPertinentInformation2,
  DispenseClaimPertinentSupplyHeader,
  DispenseClaimSuppliedLineItemQuantity,
  LegalAuthenticator,
  PrimaryInformationRecipient,
  Timestamp
} from "../../../../../../models/hl7-v3"
import {getExtensionForUrl, getMessageId} from "../../common"
import {convertMomentToHl7V3DateTime} from "../../common/dateTime"
import {getDispenseClaims, getMessageHeader} from "../../common/getResourcesOfType"
import {createAgentPersonForUnattendedAccess} from "../agent-unattended"
import {
  createAgentOrganisationFromReference,
  createLineItemStatusCode,
  createPriorPrescriptionReleaseEventRef,
  getOrganisationPerformerFromClaim
} from "./dispense-common"

export async function convertDispenseClaimInformation(
  bundle: fhir.Bundle,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  logger: pino.Logger
): Promise<hl7V3.DispenseClaimInformation> {
  const messageId = getMessageId([bundle.identifier], "Bundle.identifier")
  const fhirHeader = getMessageHeader(bundle)

  const now = convertMomentToHl7V3DateTime(moment.utc())

  const hl7DispenseClaimInformation = new hl7V3.DispenseClaimInformation(
    new hl7V3.GlobalIdentifier(messageId),
    now
  )

  const claims = getDispenseClaims(bundle)
  const firstClaim = claims[0]

  const fhirOrganisationPerformer = getOrganisationPerformerFromClaim(firstClaim)
  const hl7PertinentInformation1 = await createPertinentInformation1(
    bundle,
    messageId,
    now,
    fhirOrganisationPerformer,
    claims,
    firstClaim,
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
  fhirClaims: Array<fhir.DispenseClaimInformation>,
  firstClaim: fhir.DispenseClaimInformation,
  logger: pino.Logger
) {

  const hl7PertinentPrescriptionStatus = createPertinentPrescriptionStatusForClaim()
  const hl7PertinentPrescriptionIdentifier = createPertinentPrescriptionIdForClaim()
  const hl7PriorOriginalRef = createPriorOriginalRefForClaim()

  const hl7PertinentInformation1LineItems = fhirClaims.map(
    () => {
      return createPertinentInformation1LineItemForClaim(
        firstClaim,
        {code: "FAKE_MEDICATION_CODE"}
      )
    }
  )

  const hl7RepresentedOrganisationCode = fhirOrganisation.identifier.value
  // TODO - Unattended access?
  const agentPerson = await createAgentPersonForUnattendedAccess(hl7RepresentedOrganisationCode, logger)
  const legalAuthenticator = new LegalAuthenticator(agentPerson, timestamp)
  const supplyHeader = new DispenseClaimPertinentSupplyHeader(new hl7V3.GlobalIdentifier(messageId))
  supplyHeader.legalAuthenticator = legalAuthenticator
  supplyHeader.pertinentInformation1 = hl7PertinentInformation1LineItems
  supplyHeader.pertinentInformation3 = new hl7V3.DispensePertinentInformation3(hl7PertinentPrescriptionStatus)
  supplyHeader.pertinentInformation4 = new hl7V3.DispensePertinentInformation4(hl7PertinentPrescriptionIdentifier)
  supplyHeader.inFulfillmentOf = new hl7V3.InFulfillmentOf(hl7PriorOriginalRef)

  return new hl7V3.DispensePertinentInformation1(supplyHeader)
}

export function createPertinentPrescriptionStatusForClaim(): hl7V3.PertinentPrescriptionStatus {
  // TODO: Where do we get prescription status from?
  const fhirPrescriptionStatus = {valueCoding: {
    code: "12345",
    display: "MOCK STATUS"
  }
  }
  const hl7StatusCode = new hl7V3.StatusCode(fhirPrescriptionStatus.valueCoding.code)
  hl7StatusCode._attributes.displayName = fhirPrescriptionStatus.valueCoding.display
  return new hl7V3.PertinentPrescriptionStatus(hl7StatusCode)
}

export function createPertinentPrescriptionIdForClaim(): hl7V3.PrescriptionId {
  // TODO: Need to get the group identifier from the claim
  const fhirGroupIdentifierExtension = getFhirGroupIdentifierExtensionForClaim()
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

export function createPertinentInformation1LineItemForClaim(
  dispenseClaim: fhir.DispenseClaimInformation,
  medicationCoding: fhir.Coding,
): hl7V3.DispenseClaimPertinentInformation1LineItem {
  const fhirPrescriptionDispenseItemNumber = "1" // TODO: Fake prescription item number
  const fhirPrescriptionLineItemStatus = {code: "FAKE_LINE_ITEM_STATUS_CODE"}

  const hl7SuppliedLineItemQuantitySnomedCode = new hl7V3.SnomedCode(
    dispenseClaim.item.quantity.code,
    dispenseClaim.item.quantity.unit
  )
  const hl7UnitValue = dispenseClaim.item.quantity.value.toString()
  const hl7Quantity = new hl7V3.QuantityInAlternativeUnits(
    hl7UnitValue,
    hl7UnitValue,
    hl7SuppliedLineItemQuantitySnomedCode
  )
  const hl7ItemStatusCode = createLineItemStatusCode(fhirPrescriptionLineItemStatus)
  const hl7PriorOriginalItemRef = "12345" // TODO: Get prescription item ID from dispense claim
  const hl7SuppliedLineItemQuantity = createSuppliedLineItemQuantity(
    hl7SuppliedLineItemQuantitySnomedCode,
    hl7Quantity,
    medicationCoding,
  )

  const hl7PertinentSuppliedLineItem = new hl7V3.DispenseClaimPertinentSuppliedLineItem(
    new hl7V3.GlobalIdentifier(fhirPrescriptionDispenseItemNumber),
    new hl7V3.SnomedCode(medicationCoding.code)
  )

  hl7PertinentSuppliedLineItem.component = new DispenseClaimLineItemComponent(hl7SuppliedLineItemQuantity)
  hl7PertinentSuppliedLineItem.pertinentInformation3 = new hl7V3.DispenseLineItemPertinentInformation3(
    new hl7V3.PertinentItemStatus(hl7ItemStatusCode)
  )
  hl7PertinentSuppliedLineItem.inFulfillmentOf = new hl7V3.InFulfillmentOfLineItem(
    new hl7V3.PriorOriginalRef(new hl7V3.GlobalIdentifier(hl7PriorOriginalItemRef))
  )

  return new hl7V3.DispenseClaimPertinentInformation1LineItem(hl7PertinentSuppliedLineItem)
}

export function createSuppliedLineItemQuantity(
  hl7SuppliedLineItemQuantitySnomedCode: hl7V3.SnomedCode,
  hl7Quantity: hl7V3.QuantityInAlternativeUnits,
  fhirMedicationCodeableConceptCoding: fhir.Coding
): DispenseClaimSuppliedLineItemQuantity {
  const dispenseProduct = new hl7V3.DispenseProduct(
    new hl7V3.SuppliedManufacturedProduct(
      new hl7V3.ManufacturedRequestedMaterial(
        new hl7V3.SnomedCode(
          fhirMedicationCodeableConceptCoding.code,
          fhirMedicationCodeableConceptCoding.display
        )
      )
    )
  )

  const pertinentInformation1 = new hl7V3.DispenseClaimLineItemPertinentInformation1(
    new DispenseClaimChargePayment(
      true // TODO: Need to work out where we obtain this
    )
  )

  const pertinentInformation2: Array<DispenseClaimLineItemPertinentInformation2> = []

  const hl7SuppliedLineItemQuantity = new hl7V3.DispenseClaimSuppliedLineItemQuantity(
    hl7SuppliedLineItemQuantitySnomedCode,
    hl7Quantity,
    dispenseProduct,
    pertinentInformation1,
    pertinentInformation2
  )

  return hl7SuppliedLineItemQuantity
}

export function createPriorOriginalRefForClaim(): hl7V3.PriorOriginalRef {
  const fhirGroupIdentifierExtension = getFhirGroupIdentifierExtensionForClaim()
  const fhirAuthorizingPrescriptionShortFormIdExtension = getExtensionForUrl(
    fhirGroupIdentifierExtension.extension,
    "UUID",
    "Claim.originalPrescription.extension.valueIdentifier"
  ) as fhir.IdentifierExtension
  const id = fhirAuthorizingPrescriptionShortFormIdExtension.valueIdentifier.value
  return new hl7V3.PriorOriginalRef(
    new hl7V3.GlobalIdentifier(id)
  )
}

export function getFhirGroupIdentifierExtensionForClaim(): fhir.ExtensionExtension<fhir.Extension> {
  // TODO: Not clear where this should come from?
  const ext = {
    url: "http://mock.extension.url",
    extension: [{
      url: "http:mock.extension.url"
    }]
  }

  return ext
}
