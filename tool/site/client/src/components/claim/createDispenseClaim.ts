import * as fhir from "fhir/r4"
import * as uuid from "uuid"
import {
  ClaimMedicationRequestReferenceExtension,
  ClaimSequenceIdentifierExtension,
  getGroupIdentifierExtension,
  getTaskBusinessStatusExtension,
  GroupIdentifierExtension,
  TaskBusinessStatusExtension,
  URL_CLAIM_MEDICATION_REQUEST_REFERENCE,
  URL_CLAIM_SEQUENCE_IDENTIFIER
} from "../../fhir/customExtensions"
import {
  CODEABLE_CONCEPT_CLAIM_TYPE_PHARMACY,
  CODEABLE_CONCEPT_EXEMPTION_EVIDENCE_SEEN,
  CODEABLE_CONCEPT_EXEMPTION_NO_EVIDENCE_SEEN,
  CODEABLE_CONCEPT_PAYEE_TYPE_PROVIDER,
  CODEABLE_CONCEPT_PRESCRIPTION,
  CODEABLE_CONCEPT_PRESCRIPTION_CHARGE_NOT_PAID,
  CODEABLE_CONCEPT_PRESCRIPTION_CHARGE_PAID,
  CODEABLE_CONCEPT_PRIORITY_NORMAL
} from "../../fhir/reference-data/codeableConcepts"
import {INSURANCE_NHS_BSA} from "../../fhir/reference-data/insurance"
import {ClaimFormValues, EndorsementFormValues, ExemptionFormValues, ProductFormValues} from "./claimForm"
import {
  DISPENSER_ENDORSEMENT_CODE_NONE,
  LineItemStatus,
  VALUE_SET_DISPENSER_ENDORSEMENT,
  VALUE_SET_PRESCRIPTION_CHARGE_EXEMPTION
} from "../../fhir/reference-data/valueSets"
import {
  createDispensingRepeatInformationExtension,
  createIdentifier,
  getMedicationDispenseLineItemId,
  getMedicationRequestLineItemId,
  getTotalQuantity, MedicationDispense, MedicationRequest,
  requiresDispensingRepeatInformationExtension
} from "../../fhir/helpers"

export function createClaim(
  patient: fhir.Patient,
  medicationRequests: Array<MedicationRequest>,
  medicationDispenses: Array<MedicationDispense>,
  claimFormValues: ClaimFormValues
): fhir.Claim {
  const patientIdentifier = patient.identifier[0]

  const finalMedicationDispense = medicationDispenses[medicationDispenses.length - 1]
  const prescriptionStatusExtension = getTaskBusinessStatusExtension(finalMedicationDispense.extension)

  const actors = finalMedicationDispense.performer.map(performer => performer.actor)
  const claimingPractitionerReference = actors.find(actor => actor.type === "Practitioner")
  const claimingOrganizationReference = actors.find(actor => actor.type === "Organization")

  const authorizingPrescription = finalMedicationDispense.authorizingPrescription[0]
  const groupIdentifierExtension = getGroupIdentifierExtension(authorizingPrescription.extension)

  return {
    resourceType: "Claim",
    created: new Date().toISOString(),
    identifier: [createIdentifier()],
    status: "active",
    type: CODEABLE_CONCEPT_CLAIM_TYPE_PHARMACY,
    use: "claim",
    patient: createClaimPatient(patientIdentifier),
    provider: claimingPractitionerReference,
    priority: CODEABLE_CONCEPT_PRIORITY_NORMAL,
    insurance: [INSURANCE_NHS_BSA],
    payee: createClaimPayee(claimingOrganizationReference),
    prescription: createClaimPrescription(groupIdentifierExtension),
    item: [
      createClaimItem(
        prescriptionStatusExtension,
        medicationRequests,
        medicationDispenses,
        claimFormValues
      )
    ]
  }
}

function createClaimPatient(identifier: fhir.Identifier) {
  return {
    //Doing it this way to avoid copying the verification status extension
    identifier: {
      system: identifier.system,
      value: identifier.value
    }
  }
}

function createClaimPayee(claimingOrganizationReference: fhir.Reference): fhir.ClaimPayee {
  return {
    type: CODEABLE_CONCEPT_PAYEE_TYPE_PROVIDER,
    party: claimingOrganizationReference
  }
}

function createClaimPrescription(groupIdentifierExtension: GroupIdentifierExtension): fhir.Reference {
  return {
    extension: [groupIdentifierExtension]
  }
}

function createClaimItem(
  prescriptionStatusExtension: TaskBusinessStatusExtension,
  medicationRequests: Array<MedicationRequest>,
  medicationDispenses: Array<MedicationDispense>,
  claimFormValues: ClaimFormValues
): fhir.ClaimItem {
  return {
    extension: [prescriptionStatusExtension],
    sequence: 1,
    productOrService: CODEABLE_CONCEPT_PRESCRIPTION,
    programCode: createExemptionCodeableConcepts(claimFormValues.exemption),
    detail: medicationRequests.map((medicationRequest, index) => {
      const lineItemId = getMedicationRequestLineItemId(medicationRequest)
      const medicationDispensesForRequest = medicationDispenses.filter(
        medicationDispense => getMedicationDispenseLineItemId(medicationDispense) === lineItemId
      )
      const productFormValuesForRequest = claimFormValues.products.find(product => product.id === lineItemId)
      return createClaimItemDetail(
        index + 1,
        medicationRequest,
        medicationDispensesForRequest,
        productFormValuesForRequest
      )
    })
  }
}

function createExemptionCodeableConcepts(exemption: ExemptionFormValues) {
  const exemptionStatusCodeableConcept: fhir.CodeableConcept = {
    coding: VALUE_SET_PRESCRIPTION_CHARGE_EXEMPTION.filter(coding => coding.code === exemption.code)
  }

  const evidenceSeenCodeableConcept = exemption.evidenceSeen
    ? CODEABLE_CONCEPT_EXEMPTION_EVIDENCE_SEEN
    : CODEABLE_CONCEPT_EXEMPTION_NO_EVIDENCE_SEEN

  return [
    exemptionStatusCodeableConcept,
    evidenceSeenCodeableConcept
  ]
}

function createClaimItemDetail(
  sequence: number,
  medicationRequest: fhir.MedicationRequest,
  medicationDispenses: Array<fhir.MedicationDispense>,
  productFormValues: ProductFormValues
): fhir.ClaimItemDetail {
  const lineItemId = getMedicationRequestLineItemId(medicationRequest)

  const claimItemDetailExtensions: Array<fhir.Extension> = [
    createClaimSequenceIdentifierExtension(),
    createMedicationRequestReferenceExtension(lineItemId)
  ]

  if (requiresDispensingRepeatInformationExtension(medicationRequest)) {
    const repeatInformationExtension = createDispensingRepeatInformationExtension(medicationRequest)
    claimItemDetailExtensions.push(repeatInformationExtension)
  }

  const finalMedicationDispense = medicationDispenses[medicationDispenses.length - 1]
  const finalItemStatus = finalMedicationDispense.type

  const claimItemDetail: fhir.ClaimItemDetail = {
    extension: claimItemDetailExtensions,
    sequence,
    productOrService: medicationRequest.medicationCodeableConcept,
    modifier: [finalItemStatus],
    quantity: medicationRequest.dispenseRequest.quantity
  }

  const fullyDispensed = finalItemStatus.coding[0].code === LineItemStatus.DISPENSED
  if (fullyDispensed) {
    claimItemDetail.subDetail = [
      createClaimItemDetailSubDetail(1, medicationDispenses, productFormValues)
    ]
  }

  return claimItemDetail
}

function createClaimSequenceIdentifierExtension(): ClaimSequenceIdentifierExtension {
  return {
    url: URL_CLAIM_SEQUENCE_IDENTIFIER,
    valueIdentifier: {
      system: "https://fhir.nhs.uk/Id/claim-sequence-identifier",
      value: uuid.v4()
    }
  }
}

function createMedicationRequestReferenceExtension(lineItemId: string): ClaimMedicationRequestReferenceExtension {
  return {
    url: URL_CLAIM_MEDICATION_REQUEST_REFERENCE,
    valueReference: {
      identifier: {
        system: "https://fhir.nhs.uk/Id/prescription-order-item-number",
        value: lineItemId
      }
    }
  }
}

function createClaimItemDetailSubDetail(
  sequence: number,
  medicationDispenses: Array<fhir.MedicationDispense>,
  productFormValues: ProductFormValues
): fhir.ClaimItemDetailSubDetail {
  const endorsementCodeableConcepts = productFormValues.endorsements.length
    ? productFormValues.endorsements.map(createEndorsementCodeableConcept)
    : [{
      coding: VALUE_SET_DISPENSER_ENDORSEMENT.filter(coding => coding.code === DISPENSER_ENDORSEMENT_CODE_NONE)
    }]

  const chargePaidCodeableConcept = productFormValues.patientPaid
    ? CODEABLE_CONCEPT_PRESCRIPTION_CHARGE_PAID
    : CODEABLE_CONCEPT_PRESCRIPTION_CHARGE_NOT_PAID

  return {
    sequence,
    productOrService: medicationDispenses[0].medicationCodeableConcept,
    quantity: getTotalQuantity(medicationDispenses.map(medicationDispense => medicationDispense.quantity)),
    programCode: [
      ...endorsementCodeableConcepts,
      chargePaidCodeableConcept
    ]
  }
}

function createEndorsementCodeableConcept(endorsement: EndorsementFormValues): fhir.CodeableConcept {
  const endorsementCodeableConcept: fhir.CodeableConcept = {
    coding: VALUE_SET_DISPENSER_ENDORSEMENT.filter(coding => coding.code === endorsement.code)
  }
  if (endorsement.supportingInfo) {
    endorsementCodeableConcept.text = endorsement.supportingInfo
  }
  return endorsementCodeableConcept
}
