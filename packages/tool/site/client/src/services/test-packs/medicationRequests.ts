import {PrescriptionRow} from "./xls"
import * as fhir from "fhir/r4"
import * as uuid from "uuid"
import {URL_UK_CORE_NUMBER_OF_PRESCRIPTIONS_ISSUED, URL_UK_CORE_REPEAT_INFORMATION} from "../../fhir/customExtensions"
import {getPrescriptionTreatmentType, TreatmentType} from "."

export function createMedicationRequests(
  medicationRows: Array<PrescriptionRow>,
  odsCode: string,
  repeatsIssued: number,
  maxRepeatsAllowed: number
): Array<fhir.BundleEntry> {
  return medicationRows.map((row: PrescriptionRow) => {
    const id = uuid.v4()
    const prescriptionTreatmentType = createPrescriptionType(row) as {code: TreatmentType}

    const medicationRequest: fhir.MedicationRequest = {
      resourceType: "MedicationRequest",
      id: id,
      extension: getMedicationRequestExtensions(
        row,
        prescriptionTreatmentType.code,
        repeatsIssued
      ),
      identifier: [
        {
          system: "https://fhir.nhs.uk/Id/prescription-order-item-number",
          value: id
        }
      ],
      status: "active",
      intent: prescriptionTreatmentType.code === "acute" ? "order" : "original-order",
      category: [
        {
          coding: [
            {
              system:
                "http://terminology.hl7.org/CodeSystem/medicationrequest-category",
              code: "outpatient",
              display: "Outpatient"
            }
          ]
        }
      ],
      medicationCodeableConcept: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: row.medicationSnomed,
            display: row.medicationName
          }
        ]
      },
      subject: {
        reference: "urn:uuid:78d3c2eb-009e-4ec8-a358-b042954aa9b2"
      },
      authoredOn: "2021-05-07T14:47:29+00:00",
      requester: {
        reference: "urn:uuid:56166769-c1c4-4d07-afa8-132b5dfca666"
      },
      groupIdentifier: {
        extension: [
          {
            url:
              "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId",
            valueIdentifier: {
              system: "https://fhir.nhs.uk/Id/prescription",
              value: "a5b9dc81-ccf4-4dab-b887-3d88e557febb"
            }
          }
        ],
        system: "https://fhir.nhs.uk/Id/prescription-order-number",
        value: `A0548B-${odsCode}-451485`
      },
      courseOfTherapyType: {
        coding: [
          prescriptionTreatmentType
        ]
      },
      dosageInstruction: [
        {
          text: row.dosageInstructions
        }
      ],
      dispenseRequest: getDispenseRequest(row, maxRepeatsAllowed),
      substitution: {
        allowedBoolean: false
      },
      note: row.dispenserNotes.map(note => {
        return {text: note}
      })
    }

    return {
      fullUrl: `urn:uuid:${id}`,
      resource: medicationRequest
    }
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createPrescriptionType(row: PrescriptionRow): any {
  const treatmentTypeCode = getPrescriptionTreatmentType(row)
  const treatmentTypeSystem =
    treatmentTypeCode === "continuous-repeat-dispensing"
      ? "https://fhir.nhs.uk/CodeSystem/medicationrequest-course-of-therapy"
      : "http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy"
  return {
    system: treatmentTypeSystem,
    code: treatmentTypeCode
  }
}

// eslint-disable-next-line max-len
function getDispenseRequest(row: PrescriptionRow, numberOfRepeatsAllowed: number): fhir.MedicationRequestDispenseRequest {
  const dispenseRequest: fhir.MedicationRequestDispenseRequest =
    {
      extension: [
        {
          url:
            "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PerformerSiteType",
          valueCoding: {
            system: "https://fhir.nhs.uk/CodeSystem/dispensing-site-preference",
            code: "P1"
          }
        }
      ],
      performer: {
        identifier: {
          system: "https://fhir.nhs.uk/Id/ods-organization-code",
          value: "VNCEL"
        }
      },
      quantity: getMedicationQuantity(row),
      expectedSupplyDuration: {
        value: parseInt(row.issueDurationInDays),
        unit: "day",
        system: "http://unitsofmeasure.org",
        code: "d"
      }
    }

  if (row.startDate) {
    dispenseRequest.validityPeriod = {
      start: row.startDate
    }
  }

  if (row.nominatedPharmacy === undefined && row.nominatedPharmacyType === "0004") {
    delete dispenseRequest.performer
  }

  const prescriptionTreatmentTypeCode = getPrescriptionTreatmentType(row)

  if (prescriptionTreatmentTypeCode === "continuous-repeat-dispensing") {
    dispenseRequest.numberOfRepeatsAllowed = numberOfRepeatsAllowed
  }

  return dispenseRequest
}

export function getMedicationQuantity(row: PrescriptionRow): fhir.Quantity {
  const value = parseFloat(row.medicationQuantity)
  return {
    value: Number.isNaN(value) ? null: value,
    unit: row.medicationUnitOfMeasureName,
    system: "http://snomed.info/sct",
    code: row.medicationUnitOfMeasureCode
  }
}

// eslint-disable-next-line max-len
function getMedicationRequestExtensions(row: PrescriptionRow, prescriptionTreatmentTypeCode: TreatmentType, repeatsIssued: number): Array<fhir.Extension> {
  const {prescriptionTypeCode, prescriptionTypeDescription, controlledDrugQuantity, controlledDrugSchedule} = row
  const extension: Array<fhir.Extension> = [
    {
      url:
        "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType",
      valueCoding: {
        system: "https://fhir.nhs.uk/CodeSystem/prescription-type",
        code: prescriptionTypeCode,
        display: prescriptionTypeDescription
      }
    }
  ]

  if (prescriptionTreatmentTypeCode !== "acute") {
    extension.push(createRepeatInformationExtensions(prescriptionTreatmentTypeCode, repeatsIssued))
  }

  row.endorsements?.split(", ").forEach(endorsement =>
    extension.push({
      url:
        "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionEndorsement",
      valueCodeableConcept: {
        coding: [
          {
            system:
              "https://fhir.nhs.uk/CodeSystem/medicationrequest-endorsement",
            code: endorsement
          }
        ]
      }
    })
  )

  if (controlledDrugQuantity && controlledDrugSchedule) {
    extension.push({
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ControlledDrug",
      extension: [
        {
          url: "quantityWords",
          valueString: controlledDrugQuantity
        },
        {
          url: "schedule",
          valueCoding: {
            system: "https://fhir.nhs.uk/CodeSystem/medicationrequest-controlled-drug",
            code: `CD${controlledDrugSchedule}`,
            display: `Schedule ${controlledDrugSchedule}`
          }
        }
      ]
    })
  }

  return extension
}

function createRepeatInformationExtensions(
  prescriptionTreatmentTypeCode: TreatmentType,
  repeatsIssued: number
): {url: string, extension: Array<fhir.Extension>} {
  const extension: Array<fhir.Extension> = [
    {
      url: "authorisationExpiryDate",
      // todo: work this out from "days treatment"
      valueDateTime: new Date(2025, 1, 1).toISOString().slice(0, 10)
    }
  ]

  if (prescriptionTreatmentTypeCode === "continuous") {
    extension.push({
      url: URL_UK_CORE_NUMBER_OF_PRESCRIPTIONS_ISSUED,
      valueUnsignedInt: repeatsIssued
    })
  }
  return {
    url: URL_UK_CORE_REPEAT_INFORMATION,
    extension: extension
  }
}
