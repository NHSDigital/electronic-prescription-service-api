import {PrescriptionRow} from "./xls"
import * as fhir from "fhir/r4"
import * as uuid from "uuid"
import moment from "moment"
import {convertMomentToISODate} from "../../formatters/dates"
import {URL_UK_CORE_NUMBER_OF_PRESCRIPTIONS_ISSUED, URL_UK_CORE_REPEAT_INFORMATION} from "../../fhir/customExtensions"
import {getPrescriptionTreatmentType, TreatmentType} from "."

export function createMedicationRequests(
  testCase: Array<PrescriptionRow>,
  repeatsIssued: number,
  maxRepeatsAllowed: number
): Array<fhir.BundleEntry> {
  return testCase.map((row: PrescriptionRow) => {
    const id = uuid.v4()
    const prescriptionTreatmentType = createPrescriptionType(row) as { code: TreatmentType }
    return {
      fullUrl: `urn:uuid:${id}`,
      resource: {
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
        intent: "order",
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
          value: "A0548B-A99968-451485"
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
        }
      }
    } as fhir.BundleEntry
  })
}

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

function getDispenseRequest(row: PrescriptionRow, numberOfRepeatsAllowed: number): fhir.MedicationRequestDispenseRequest {
  const prescriptionTreatmentTypeCode = getPrescriptionTreatmentType(row)

  const shouldHaveRepeatInformation = prescriptionTreatmentTypeCode !== "acute"

  if (shouldHaveRepeatInformation) {
    const start = convertMomentToISODate(moment.utc())
    const end = convertMomentToISODate(moment.utc().add(1, "month"))
    const dispenseRequest: any =
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
      validityPeriod: {
        start: start,
        end: end
      },
      expectedSupplyDuration: {
        value: row.issueDurationInDays,
        unit: "day",
        system: "http://unitsofmeasure.org",
        code: "d"
      }
    }

    if (prescriptionTreatmentTypeCode === "continuous-repeat-dispensing") {
      dispenseRequest.numberOfRepeatsAllowed = numberOfRepeatsAllowed
    }

    return dispenseRequest
  }

  return {
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
    quantity: getMedicationQuantity(row)
  }
}

function getMedicationQuantity(row: PrescriptionRow): fhir.Quantity {
  return {
    value: parseInt(row.medicationQuantity),
    unit: row.medicationUnitOfMeasureName,
    system: "http://snomed.info/sct",
    code: row.medicationUnitOfMeasureCode
  }
}

function getMedicationRequestExtensions(row: PrescriptionRow, prescriptionTreatmentTypeCode: TreatmentType, repeatsIssued: number): Array<fhir.Extension> {
  const prescriberTypeCode = row.prescriptionTypeCode
  const prescriberTypeDisplay = row.prescriptionTypeDescription
  const extension: Array<fhir.Extension> = [
    {
      url:
        "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType",
      valueCoding: {
        system: "https://fhir.nhs.uk/CodeSystem/prescription-type",
        code: prescriberTypeCode,
        display: prescriberTypeDisplay
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

  return extension
}

function createRepeatInformationExtensions(
  prescriptionTreatmentTypeCode: TreatmentType,
  repeatsIssued: number
): { url: string, extension: fhir.Extension[] } {
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
