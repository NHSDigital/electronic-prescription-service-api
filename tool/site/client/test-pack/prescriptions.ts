import * as uuid from "uuid"
import moment from "moment"
import * as fhirCommon from "../models/common"
import * as fhirExtension from "../models/extension"
import {groupBy, StringKeyedObject} from "./helpers"
import {
  Bundle,
  BundleEntry,
  PractitionerRole,
  CommunicationRequest,
  MedicationRequestDispenseRequest
} from "../models"
import {convertMomentToISODate} from "../lib/date-time"
import {createMessageHeaderEntry} from "./message-header"
import {getNhsNumber} from "../parsers/read/patient-parser"
import {createPlaceResources} from "./places"
import {updateNominatedPharmacy} from "../parsers/write/bundle-parser"

export function createPrescriptions(
  patients: Array<BundleEntry>,
  prescribers: Array<BundleEntry>,
  nominatedPharmacies: Array<string>,
  rows: Array<StringKeyedObject>
): any[] {
  const prescriptions = []
  const prescriptionRows = groupBy(rows, (row: StringKeyedObject) => row["Test"])
  prescriptionRows.forEach(prescriptionRows => {
    const prescriptionRow = prescriptionRows[0]
    const patient = getPatientBundleEntry(patients, prescriptionRow)
    const prescriber = getPrescriberBundleEntry(prescribers, prescriptionRow)
    const nominatedPharmacy = getNominatedPharmacyOdsCode(nominatedPharmacies, prescriptionRow)

    const prescriptionTreatmentTypeCode = getPrescriptionTreatmentTypeCode(prescriptionRow)

    if (prescriptionTreatmentTypeCode === "continuous") {
      const repeatsAllowed = getNumberOfRepeatsAllowed(prescriptionRow)
      for (
        let repeatsIssued = 0;
        repeatsIssued < repeatsAllowed;
        repeatsIssued++
      ) {
        const prescription = createPrescription(
          patient,
          prescriber,
          prescriptionRows,
          repeatsIssued,
          repeatsAllowed
        )
        const bundle = JSON.parse(prescription)
        updateNominatedPharmacy(bundle, nominatedPharmacy)
        prescriptions.push(JSON.stringify(bundle))
      }
    } else if (prescriptionTreatmentTypeCode === "continuous-repeat-dispensing") {
      const prescription = createPrescription(
        patient,
        prescriber,
        prescriptionRows,
        0,
        parseInt(prescriptionRow["Issues"]) - 1
      )
      const bundle = JSON.parse(prescription)
      updateNominatedPharmacy(bundle, nominatedPharmacy)
      prescriptions.push(JSON.stringify(bundle))
    } else {
      const prescription = createPrescription(patient, prescriber, prescriptionRows)
      const bundle = JSON.parse(prescription)
      updateNominatedPharmacy(bundle, nominatedPharmacy)
      prescriptions.push(JSON.stringify(bundle))
    }
  })
  return prescriptions
}

function getPatientBundleEntry(patients: Array<BundleEntry>, prescriptionRow: StringKeyedObject) {
  const testNumber = parseInt(prescriptionRow["Test"])
  return patients[testNumber - 1]
}

function getPrescriberBundleEntry(prescribers: Array<BundleEntry>, prescriptionRow: StringKeyedObject) {
  if (!prescriptionRow["Test"]) {
    return null
  }

  const testNumber = parseInt(prescriptionRow["Test"])
  return prescribers[testNumber - 1]
}

function getNominatedPharmacyOdsCode(nominatedPharmacies: Array<string>, prescriptionRow: StringKeyedObject) {
  if (!prescriptionRow["Test"]) {
    return null
  }
  const testNumber = parseInt(prescriptionRow["Test"])
  return nominatedPharmacies[testNumber - 1]
}

function createPrescription(
  patientEntry: BundleEntry,
  practitionerEntry: BundleEntry,
  prescriptionRows: Array<StringKeyedObject>,
  repeatsIssued = 0,
  maxRepeatsAllowed = 0
): string {
  const careSetting = getCareSetting(prescriptionRows)

  const practitionerRoleEntry: BundleEntry = {
    fullUrl: "urn:uuid:56166769-c1c4-4d07-afa8-132b5dfca666",
    resource: <PractitionerRole> {
      resourceType: "PractitionerRole",
      id: "56166769-c1c4-4d07-afa8-132b5dfca666",
      identifier: [
        {
          system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
          value: "100102238986"
        }
      ],
      practitioner: {
        reference: "urn:uuid:a8c85454-f8cb-498d-9629-78e2cb5fa47a"
      },
      organization: {
        reference: "urn:uuid:3b4b03a5-52ba-4ba6-9b82-70350aa109d8"
      },
      code: [
        {
          coding: [
            {
              system:
                "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
              code: "R8000", // todo: remove hardcoding?
              display: "Clinical Practitioner Access Role"
            }
          ]
        }
      ],
      telecom: [
        {
          system: "phone",
          value: "01234567890",
          use: "work"
        }
      ]
    }
  }

  if (careSetting === "Secondary-Care" || careSetting === "Homecare") {
    (practitionerRoleEntry.resource as PractitionerRole).healthcareService = [
      {
        reference: "urn:uuid:54b0506d-49af-4245-9d40-d7d64902055e"
      }
    ]
  }

  const fhirPrescription: Bundle = {
    resourceType: "Bundle",
    id: "aef77afb-7e3c-427a-8657-2c427f71a272",
    identifier: {
      system: "https://tools.ietf.org/html/rfc4122",
      value: "ea66ee9d-a981-432f-8c27-6907cbd99219"
    },
    type: "message",
    entry: [
      createMessageHeaderEntry(),
      patientEntry,
      practitionerEntry ?? {/*todo: default for this */},
      practitionerRoleEntry,
      {
        fullUrl: "urn:uuid:51793ac0-112f-46c7-a891-9af8cefb206e",
        resource: <CommunicationRequest> {
          resourceType: "CommunicationRequest",
          status: "unknown",
          subject: {
            reference: "urn:uuid:78d3c2eb-009e-4ec8-a358-b042954aa9b2"
          },
          payload: [
            {
              contentString: "TEST PRESCRIPTION - DO NOT DISPENSE"
            }
          ],
          requester: {
            type: "Organization",
            identifier: {
              system: "https://fhir.nhs.uk/Id/ods-organization-code",
              value: "RBA" // todo: remove hardcoded
            }
          },
          recipient: [
            {
              type: "Patient",
              identifier: {
                system: "https://fhir.nhs.uk/Id/nhs-number",
                value: getNhsNumber(patientEntry)
              }
            }
          ]
        }
      }
    ]
  }
  createMedicationRequests(
    prescriptionRows,
    repeatsIssued,
    maxRepeatsAllowed
  ).forEach(medicationRequest =>
    fhirPrescription.entry.push(medicationRequest)
  )
  createPlaceResources(careSetting, fhirPrescription)
  return JSON.stringify(fhirPrescription)
}

function getPrescriptionTreatmentTypeCode(row: StringKeyedObject): string {
  const validCodes = ["acute", "repeat-prescribing", "repeat-dispensing"]
  const code = row["Prescription Treatment Type"].split(" ")[0]
  if (!validCodes.includes(code)) {
    throw new Error(`Prescription Treatment Type column contained an invalid value. 'Prescription Treatment Type' must be one of: ${validCodes.join(", ")}`)
  }
  switch(code) {
    case "acute":
      return "acute"
    case "repeat-prescribing":
      return "continuous"
    case "repeat-dispensing":
      return "continuous-repeat-dispensing"
  }
}

function getNumberOfRepeatsAllowed(row: StringKeyedObject) {
  return parseInt(row["Issues"])
}

function getCareSetting(prescriptionRows: Array<StringKeyedObject>): string {
  const row = prescriptionRows[0]
  const prescriberTypeCode = row["Prescription Type"].toString()
  switch (prescriberTypeCode) {
    // https://simplifier.net/guide/DigitalMedicines/DM-Prescription-Type
    case "0108":
    case "0101":
    case "0125":
    case "0105":
    case "0113":
      return "Primary-Care"
    case "1004":
    case "1001":
      return "Secondary-Care"
    case "1201":
    case "1204":
    case "1208":
      return "Homecare"
    default:
      throw new Error("Unable to determine care-setting from 'Prescription Type'")
  }
}

function createMedicationRequests(
  xlsxRowGroup: Array<StringKeyedObject>,
  repeatsIssued: number,
  maxRepeatsAllowed: number
) {
  return xlsxRowGroup.map((row: StringKeyedObject) => {
    const id = uuid.v4()
    return {
      fullUrl: `urn:uuid:${id}`,
      resource: {
        resourceType: "MedicationRequest",
        id: id,
        extension: getMedicationRequestExtensions(
          row,
          repeatsIssued,
          maxRepeatsAllowed
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
              code: getMedicationSnomedCode(row),
              display: getMedicationDisplay(row)
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
            createPrescriptionType(row)
          ]
        },
        dosageInstruction: [
          {
            text: getDosageInstructionText(row)
          }
        ],
        dispenseRequest: getDispenseRequest(row),
        substitution: {
          allowedBoolean: false
        }
      }
    }
  })
}

function getDispenseRequest(row: StringKeyedObject): MedicationRequestDispenseRequest {
  const prescriptionTreatmentTypeCode = getPrescriptionTreatmentTypeCode(row)

  const shouldHaveRepeatInformation =
    prescriptionTreatmentTypeCode === "continuous"
    || prescriptionTreatmentTypeCode === "continuous-repeat-dispensing"

  if (shouldHaveRepeatInformation) {
    const start = convertMomentToISODate(moment.utc())
    const end = convertMomentToISODate(moment.utc().add(1, "month"))
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
      quantity: getMedicationQuantity(row),
      validityPeriod: {
        start: start,
        end: end
      },
      expectedSupplyDuration: {
        value: "30",
        unit: "day",
        system: "http://unitsofmeasure.org",
        code: "d"
      }
    }
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

function getDosageInstructionText(row: StringKeyedObject): string {
  return row["Dosage Instructions"]
    ? row["Dosage Instructions"]
    : "As directed"
}

function getMedicationSnomedCode(row: StringKeyedObject): string {
  return row["Snomed"].toString()
}

function getMedicationDisplay(row: StringKeyedObject): string {
  return row["Medication"]
}

function getMedicationRequestExtensions(row: StringKeyedObject, repeatsIssued: number, maxRepeatsAllowed: number): Array<fhirExtension.Extension> {
  const prescriptionTypeCode = row["Prescription Type"].toString()
  const prescriberTypeDisplay = row["Prescriber Description"]
  const extension: Array<fhirExtension.Extension> = [
    {
      url:
        "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType",
      valueCoding: {
        system: "https://fhir.nhs.uk/CodeSystem/prescription-type",
        code: prescriptionTypeCode,
        display: prescriberTypeDisplay
      }
    } as fhirExtension.CodingExtension
  ]

  if (maxRepeatsAllowed) {
    extension.push(
      createRepeatDispensingExtensionIfRequired(
        repeatsIssued,
        maxRepeatsAllowed
      )
    )
  }

  row["Instructions for Prescribing"]?.split(", ").forEach(endorsement =>
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
    } as fhirExtension.CodeableConceptExtension)
  )

  return extension
}

function createPrescriptionType(row: StringKeyedObject): any {
  const treatmentTypeCode = getPrescriptionTreatmentTypeCode(row)
  const treatmentTypeSystem =
    treatmentTypeCode === "continuous-repeat-dispensing"
      ? "https://fhir.nhs.uk/CodeSystem/medicationrequest-course-of-therapy"
      : "http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy"
  return {
    system: treatmentTypeSystem,
    code: treatmentTypeCode
  }
}

function createRepeatDispensingExtensionIfRequired(
  repeatsIssued: number,
  maxRepeatsAllowed: number
): fhirExtension.ExtensionExtension<fhirExtension.Extension> {
  const extension = [
    {
      url: "numberOfRepeatPrescriptionsAllowed",
      valueUnsignedInt: maxRepeatsAllowed
    },
    {
      url: "authorisationExpiryDate",
      // todo: work this out from "days treatment"
      valueDateTime: new Date(2025, 1, 1).toISOString().slice(0, 10)
    }
  ]

  if (repeatsIssued > 0) {
    extension.push({
      url: "numberOfRepeatPrescriptionsIssued",
      valueUnsignedInt: repeatsIssued
    })
  }
  return {
    url:
      "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
    extension: extension
  }
}

function getMedicationQuantity(row: StringKeyedObject): fhirCommon.SimpleQuantity {
  return {
    value: row["Qty"],
    unit: row["UoM"],
    system: "http://snomed.info/sct",
    code: getMedicationQuantityCode(row["UoM"])
  }
}

function getMedicationQuantityCode(unitsOfMeasure: string) {
  switch (unitsOfMeasure) {
    case "ampoule":
      return "413516001"
    case "capsule":
      return "428641000"
    case "cartridge":
      return "732988008"
    case "dose":
      return "3317411000001100"
    case "enema":
      return "700476008"
    case "patch":
      return "419702001"
    case "plaster":
      return "733010002"
    case "pre-filled disposable injection":
      return "3318611000001103"
    case "sachet":
      return "733013000"
    case "tablet":
      return "428673006"
    case "vial":
      return "415818006"
    case "device":
    default:
      throw new Error("Unable to determine Unit of Measure from 'UoM'")
  }
}
