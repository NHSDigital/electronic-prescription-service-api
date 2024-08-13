import * as fhir from "fhir/r4"
import * as uuid from "uuid"
import {
  ClaimMedicationRequestReferenceExtension,
  ClaimSequenceIdentifierExtension,
  getLongFormIdExtension,
  getTaskBusinessStatusExtension,
  GroupIdentifierExtension,
  TaskBusinessStatusExtension,
  URL_CLAIM_MEDICATION_REQUEST_REFERENCE,
  URL_CLAIM_SEQUENCE_IDENTIFIER,
  URL_GROUP_IDENTIFIER_EXTENSION,
  URL_REPLACEMENT_OF
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
import {
  ClaimFormValues,
  EndorsementFormValues,
  ExemptionFormValues,
  ProductFormValues
} from "./claimForm"
import {
  LineItemStatus,
  VALUE_SET_DISPENSER_ENDORSEMENT,
  VALUE_SET_PRESCRIPTION_CHARGE_EXEMPTION
} from "../../fhir/reference-data/valueSets"
import {
  createDispensingRepeatInformationExtension,
  createIdentifier,
  getMedicationDispenseLineItemId,
  getMedicationRequestLineItemId,
  getTotalQuantity,
  MedicationDispense,
  MedicationRequest,
  requiresDispensingRepeatInformationExtension
} from "../../fhir/helpers"
import {PrescriptionDetails} from "../../pages/claimPage"

export function createClaim(
  prescriptionDetails: PrescriptionDetails,
  claimFormValues: ClaimFormValues
): fhir.Claim {
  const {patient, medicationRequests, medicationDispenses, dispensingOrganization, previousClaim} = prescriptionDetails
  const patientIdentifier = patient.identifier[0]

  const finalMedicationDispense = medicationDispenses[medicationDispenses.length - 1]
  const prescriptionStatusExtension = getTaskBusinessStatusExtension(finalMedicationDispense.extension)

  const containedPractitionerRole = medicationDispenses[0].contained
    ?.find(resource => resource?.resourceType === "PractitionerRole") as fhir.PractitionerRole

  const organizationId = "organizationId"
  dispensingOrganization.id = organizationId
  containedPractitionerRole.organization.reference = `#${organizationId}`

  const contained = [containedPractitionerRole, dispensingOrganization]

  const finalMedicationRequest = finalMedicationDispense.contained
    ?.find(resource => resource?.resourceType === "MedicationRequest") as MedicationRequest
  const shortFormId = finalMedicationRequest.groupIdentifier.value
  const longFormId = getLongFormIdExtension(finalMedicationRequest.groupIdentifier.extension).valueIdentifier.value

  const extensions: Array<fhir.Extension> = [
    {
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-Provenance-agent",
      valueReference: {
        identifier: {
          system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
          value: "884562163557"
        },
        display: "dummy full name"
      }
    }
  ]

  if (previousClaim) {
    const replacementOfExtension = {
      url: URL_REPLACEMENT_OF,
      valueIdentifier: {
        value: previousClaim.identifier[0].value,
        system: "https://tools.ietf.org/html/rfc4122"
      }
    }
    extensions.push(replacementOfExtension)
  }

  return {
    resourceType: "Claim",
    contained,
    created: new Date().toISOString(),
    extension: extensions,
    identifier: [createIdentifier()],
    status: "active",
    type: CODEABLE_CONCEPT_CLAIM_TYPE_PHARMACY,
    use: "claim",
    patient: createClaimPatient(patientIdentifier),
    provider: {
      reference: `#${containedPractitionerRole.id}`
    },
    priority: CODEABLE_CONCEPT_PRIORITY_NORMAL,
    insurance: [INSURANCE_NHS_BSA],
    payee: createClaimPayee(containedPractitionerRole.organization),
    prescription: createClaimPrescription(shortFormId, longFormId),
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

function createClaimPrescription(shortForm: string, longForm: string): fhir.Reference {
  const groupIdentifierExtension: GroupIdentifierExtension = {
    url: URL_GROUP_IDENTIFIER_EXTENSION,
    extension: [
      {
        url: "shortForm",
        valueIdentifier: {
          system: "https://fhir.nhs.uk/Id/prescription-order-number",
          value: shortForm
        }
      },
      {
        url: "UUID",
        valueIdentifier: {
          system: "https://fhir.nhs.uk/Id/prescription",
          value: longForm
        }
      }
    ]
  }
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

  const endorsementCodeableConcepts = productFormValues.endorsements.map(createEndorsementCodeableConcept)

  const chargePaidCodeableConcept = productFormValues.patientPaid
    ? CODEABLE_CONCEPT_PRESCRIPTION_CHARGE_PAID
    : CODEABLE_CONCEPT_PRESCRIPTION_CHARGE_NOT_PAID

  const claimItemDetail: fhir.ClaimItemDetail = {
    extension: claimItemDetailExtensions,
    sequence,
    productOrService: medicationRequest.medicationCodeableConcept,
    modifier: [finalItemStatus],
    quantity: medicationRequest.dispenseRequest.quantity,
    programCode: [
      ...endorsementCodeableConcepts,
      chargePaidCodeableConcept
    ]
  }

  const fullyDispensed = finalItemStatus.coding[0].code === LineItemStatus.DISPENSED
  if (fullyDispensed) {
    claimItemDetail.subDetail = [
      createClaimItemDetailSubDetail(1, medicationDispenses)
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
  medicationDispenses: Array<fhir.MedicationDispense>
): fhir.ClaimItemDetailSubDetail {
  return {
    sequence,
    productOrService: medicationDispenses[0].medicationCodeableConcept,
    quantity: getTotalQuantity(medicationDispenses.map(medicationDispense => medicationDispense.quantity))
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
