import * as fhir from "fhir/r4"
import {DispenseFormValues, LineItemFormValues, PrescriptionFormValues} from "./dispenseForm"
import * as uuid from "uuid"
import {TaskBusinessStatusExtension, URL_TASK_BUSINESS_STATUS} from "../../fhir/customExtensions"
import {
  LineItemStatus,
  PrescriptionStatus,
  VALUE_SET_LINE_ITEM_STATUS,
  VALUE_SET_NON_DISPENSING_REASON,
  VALUE_SET_PRESCRIPTION_STATUS
} from "../../fhir/reference-data/valueSets"
import {
  createDispensingRepeatInformationExtension,
  createIdentifier,
  getMedicationRequestLineItemId,
  orderBundleResources,
  requiresDispensingRepeatInformationExtension
} from "../../fhir/helpers"

const EVENT_CODING_DISPENSE_NOTIFICATION = {
  system: "https://fhir.nhs.uk/CodeSystem/message-event",
  code: "dispense-notification",
  display: "Dispense Notification"
}

export function createDispenseNotification(
  prescriptionOrderMessageHeader: fhir.MessageHeader,
  prescriptionOrderPatient: fhir.Patient,
  medicationRequests: Array<fhir.MedicationRequest>,
  dispenseFormValues: DispenseFormValues,
  amendId: string | null
): fhir.Bundle {
  if (dispenseFormValues.dispenseType === "custom") {
    return JSON.parse(dispenseFormValues.customDispenseFhir)
  }

  const dispenseNotificationPatient = createPatient(prescriptionOrderPatient)

  const medicationDispenses = medicationRequests.map(medicationRequest => {
    const lineItemId = getMedicationRequestLineItemId(medicationRequest)
    const formValuesForLineItem = dispenseFormValues.lineItems.find(item => item.id === lineItemId)
    return createMedicationDispense(
      medicationRequest,
      dispenseNotificationPatient,
      formValuesForLineItem,
      dispenseFormValues.prescription
    )
  })

  const dispenseNotificationMessageHeader = createMessageHeader(
    prescriptionOrderMessageHeader,
    [
      dispenseNotificationPatient,
      ...medicationDispenses
    ].map(resource => resource.id),
    amendId
  )

  return {
    resourceType: "Bundle",
    id: uuid.v4(),
    identifier: createIdentifier(),
    type: "message",
    entry: [
      dispenseNotificationMessageHeader,
      dispenseNotificationPatient,
      ...medicationDispenses,
      organisation
    ].sort(orderBundleResources).map(resource => ({fullUrl: `urn:uuid:${resource.id}`, resource}))
  }
}

function createPatient(patient: fhir.Patient) {
  const patientCopy = {...patient}

  patientCopy.id = uuid.v4()

  //TODO - work out why we're getting validation errors
  patientCopy.identifier[0] = {
    system: patientCopy.identifier[0].system,
    value: patientCopy.identifier[0].value
  }

  return patientCopy
}

function createMedicationDispense(
  medicationRequest: fhir.MedicationRequest,
  patient: fhir.Patient,
  lineItemFormValues: LineItemFormValues,
  prescriptionFormValues: PrescriptionFormValues
): fhir.MedicationDispense {
  if (lineItemFormValues.dispenseDifferentMedication && !lineItemFormValues.alternativeMedicationAvailable) {
    throw new Error("There is no alternative medication available for this request.")
  }

  const extensions: Array<fhir.Extension> = [createTaskBusinessStatusExtension(prescriptionFormValues.statusCode)]
  if (requiresDispensingRepeatInformationExtension(medicationRequest)) {
    const repeatInformationExtension = createDispensingRepeatInformationExtension(medicationRequest)
    extensions.push(repeatInformationExtension)
  }

  medicationRequest.id = "m1"

  const dispensedMedication = keepOrReplaceMedication(
    medicationRequest.medicationCodeableConcept, lineItemFormValues.dispenseDifferentMedication
  )

  return {
    resourceType: "MedicationDispense",
    id: uuid.v4(),
    extension: extensions,
    identifier: [{
      system: "https://fhir.nhs.uk/Id/prescription-dispense-item-number",
      value: uuid.v4()
    }],
    contained: [practitionerRole, medicationRequest],
    //TODO - map from line item status (nice to have)
    status: "unknown",
    statusReasonCodeableConcept: createStatusReason(lineItemFormValues),
    medicationCodeableConcept: dispensedMedication,
    subject: {
      reference: `urn:uuid:${patient.id}`,
      identifier: patient.identifier[0]
    },
    performer: [
      {
        actor: {
          reference: "#performer"
        }
      }
    ],
    authorizingPrescription: [{reference: "#m1"}],
    type: createMedicationDispenseType(lineItemFormValues.statusCode),
    quantity: createDispensedQuantity(medicationRequest.dispenseRequest.quantity, lineItemFormValues),
    daysSupply: medicationRequest.dispenseRequest.expectedSupplyDuration,
    whenHandedOver: prescriptionFormValues.dispenseDate.toISOString(),
    dosageInstruction: medicationRequest.dosageInstruction
  }
}

function createTaskBusinessStatusExtension(prescriptionStatus: PrescriptionStatus): TaskBusinessStatusExtension {
  return {
    url: URL_TASK_BUSINESS_STATUS,
    valueCoding: VALUE_SET_PRESCRIPTION_STATUS.find(coding => coding.code === prescriptionStatus)
  }
}

function createStatusReason(lineItemFormValues: LineItemFormValues): fhir.CodeableConcept {
  if (lineItemFormValues.statusCode !== LineItemStatus.NOT_DISPENSED) {
    return undefined
  }
  return {
    coding: VALUE_SET_NON_DISPENSING_REASON.filter(coding => coding.code === lineItemFormValues.nonDispensingReasonCode)
  }
}

const organisation: fhir.Organization = {
  resourceType: "Organization",
  extension:  [
    {
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-ODS-OrganisationRelationships",
      extension:  [
        {
          url: "reimbursementAuthority",
          valueIdentifier: {
            system: "https://fhir.nhs.uk/Id/ods-organization-code",
            value: "T1450"
          }
        }
      ]
    }
  ],
  identifier: [
    {
      system: "https://fhir.nhs.uk/Id/ods-organization-code",
      value: "FA565"
    }
  ],
  id: "2bf9f37c-d88b-4f86-ad5f-373c1416e04b",
  address: [
    {
      city: "West Yorkshire",
      use: "work",
      line: [
        "17 Austhorpe Road",
        "Crossgates",
        "Leeds"
      ],
      postalCode: "LS15 8BA"
    }
  ],
  active: true,
  type: [
    {
      coding: [
        {
          system: "https://fhir.nhs.uk/CodeSystem/organisation-role",
          code: "182",
          display: "PHARMACY"
        }
      ]
    }
  ],
  name: "The Simple Pharmacy",
  telecom: [
    {
      system: "phone",
      use: "work",
      value: "0113 3180277"
    }
  ]
}

const practitionerRole: fhir.PractitionerRole = {
  resourceType: "PractitionerRole",
  id: "performer",
  identifier: [
    {
      system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
      value: "555086415105"
    }
  ],
  practitioner: {
    identifier: {
      system: "https://fhir.nhs.uk/Id/sds-user-id",
      value: "3415870201"
    },
    display: "Mr Peter Potion"
  },
  organization: {
    reference: `urn:uuid:${organisation.id}`
  },
  code: [
    {
      coding: [
        {
          system: "https://fhir.nhs.uk/CodeSystem/NHSDigital-SDS-JobRoleCode",
          code: "S8000:G8000:R8000",
          display: "Clinical Practitioner Access Role"
        }
      ]
    }
  ],
  telecom: [
    {
      system: "phone",
      use: "work",
      value: "0532567890"
    }
  ]
}

function createMedicationDispenseType(lineItemStatus: LineItemStatus): fhir.CodeableConcept {
  return {
    coding: VALUE_SET_LINE_ITEM_STATUS.filter(coding => coding.code === lineItemStatus)
  }
}

function createDispensedQuantity(
  requestedQuantity: fhir.Quantity,
  {
    statusCode,
    priorStatusCode,
    suppliedQuantityValue,
    dispensedQuantityValue,
    prescribedQuantityValue
  }: LineItemFormValues
): fhir.Quantity {
  const dispensedQuantity = {...requestedQuantity}
  if (statusCode === LineItemStatus.PARTIALLY_DISPENSED) {
    dispensedQuantity.value = parseInt(suppliedQuantityValue)
  } else if (statusCode !== LineItemStatus.DISPENSED || priorStatusCode === LineItemStatus.DISPENSED) {
    dispensedQuantity.value = 0
  } else if (statusCode === LineItemStatus.DISPENSED && priorStatusCode === LineItemStatus.PARTIALLY_DISPENSED) {
    dispensedQuantity.value = prescribedQuantityValue - dispensedQuantityValue
  }
  return dispensedQuantity
}

function createMessageHeader(
  prescriptionOrderMessageHeader: fhir.MessageHeader,
  focusResourceIds: Array<string>,
  replacementOfId: string | null
): fhir.MessageHeader {
  const header: fhir.MessageHeader = {
    resourceType: "MessageHeader",
    id: uuid.v4(),
    destination: prescriptionOrderMessageHeader.destination,
    sender: {
      ...prescriptionOrderMessageHeader.sender,
      reference: undefined
    },
    source: prescriptionOrderMessageHeader.source,
    //TODO - suspect unused - remove from translations?
    response: {
      code: "ok",
      identifier: "ffffffff-ffff-4fff-bfff-ffffffffffff"
    },
    eventCoding: EVENT_CODING_DISPENSE_NOTIFICATION,
    focus: focusResourceIds.map(id => ({reference: `urn:uuid:${id}`}))
  }

  if (replacementOfId) {
    header.extension = [
      {
        url: "https://fhir.nhs.uk/StructureDefinition/Extension-replacementOf",
        valueIdentifier: {
          system: "https://tools.ietf.org/html/rfc4122",
          value: replacementOfId
        }
      }
    ]
  }

  return header
}

// eslint-disable-next-line max-len
function keepOrReplaceMedication(requestedMedication: fhir.CodeableConcept, needsReplacement: boolean): fhir.CodeableConcept {
  const medicationToSupply: fhir.CodeableConcept = {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "1858411000001101",
        "display": "Paracetamol 500mg soluble tablets (Alliance Healthcare (Distribution) Ltd) 60 tablet"
      }
    ]
  }

  return needsReplacement ? medicationToSupply : requestedMedication
}
