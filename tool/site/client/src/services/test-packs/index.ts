import * as XLSX from "xlsx"
import {
  Bundle,
  BundleEntry,
  Extension,
  HealthcareService,
  MedicationRequestDispenseRequest,
  MessageHeader,
  Organization,
  PractitionerRole,
  Quantity
} from "fhir/r4"
import {getMedicationRequestResources, getMessageHeaderResources} from "../../fhir/bundleResourceFinder"
import {convertMomentToISODate} from "../../formatters/dates"
import * as uuid from "uuid"
import * as moment from "moment"
import {Dispatch, SetStateAction} from "react"
import {URL_UK_CORE_NUMBER_OF_PRESCRIPTIONS_ISSUED, URL_UK_CORE_REPEAT_INFORMATION} from "../../fhir/customExtensions"
import {createPatients} from "./patients"
import {createPractitioners, getPractitioner} from "./practitioners"
import {XlsRow} from "./helpers"
import {DEFAULT_PRACTITIONER_ROLE} from "./practitionerRoles"
import {createCommunicationRequest} from "./communicationRequests"

export const createPrescriptionsFromExcelFile = (file: Blob, setPrescriptionsInTestPack: Dispatch<SetStateAction<any[]>>): void => {
  const reader = new FileReader()

  reader.onload = function (e) {
    const data = e.target.result
    const workbook = XLSX.read(data, {
      type: "binary"
    })

    const patientRows = getRowsFromSheet("Patients", workbook)
    const prescriberRows = getRowsFromSheet("Prescribers", workbook, false)
    const nominatedPharmacyRows = getRowsFromSheet("Nominated_Pharmacies", workbook, false)
    const prescriptionRows = getRowsFromSheet("Prescriptions", workbook)
    const patients = createPatients(patientRows)
    const prescribers = createPractitioners(prescriberRows)
    const nominatedPharmacies = createNominatedPharmacies(nominatedPharmacyRows)
    setPrescriptionsInTestPack(createPrescriptions(patients, prescribers, nominatedPharmacies, prescriptionRows))
  }

  reader.onerror = function (ex) {
    console.log(ex)
  }

  reader.readAsBinaryString(file)
}

function getRowsFromSheet(sheetName: string, workbook: XLSX.WorkBook, required = true) {
  const sheet = workbook.Sheets[sheetName]
  if (!sheet && required)
    throw new Error(`Could not find a sheet called '${sheetName}'`)
  //eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const rows = XLSX.utils.sheet_to_row_object_array(sheet)
  return rows
}

function groupBy<TKey, TValue>(list: Array<TValue>, keyGetter: (item: TValue) => TKey): Map<TKey, Array<TValue>> {
  const map = new Map()
  list.forEach(item => {
    const key = keyGetter(item)
    const collection = map.get(key)
    if (!collection) {
      map.set(key, [item])
    } else {
      collection.push(item)
    }
  })
  return map
}

function createNominatedPharmacies(rows: Array<XlsRow>): Array<string> {
  return rows.map(row => row["ODS Code"])
}

function createPrescriptions(
  patients: Array<BundleEntry>,
  prescribers: Array<BundleEntry>,
  nominatedPharmacies: Array<string>,
  rows: Array<XlsRow>
): any[] {
  const prescriptions = []
  const prescriptionRows = groupBy(rows, (row: XlsRow) => row["Test"])
  prescriptionRows.forEach(prescriptionRows => {
    const prescriptionRow = prescriptionRows[0]
    const patient = getPatient(patients, prescriptionRow)
    const prescriber = getPractitioner(prescribers, prescriptionRow)
    const nominatedPharmacy = getNominatedPharmacyOdsCode(nominatedPharmacies, prescriptionRow)

    const prescriptionTreatmentTypeCode = getPrescriptionTreatmentTypeCode(prescriptionRow)

    switch (prescriptionTreatmentTypeCode) {
      case "acute":
        createAcutePrescription(patient, prescriber, prescriptionRows, nominatedPharmacy, prescriptions)
        break
      case "continuous":
        createRepeatPrescribingPrescriptions(prescriptionRow, patient, prescriber, prescriptionRows, nominatedPharmacy, prescriptions)
        break
      case "continuous-repeat-dispensing":
        createRepeatDispensingPrescription(patient, prescriber, prescriptionRows, prescriptionRow, nominatedPharmacy, prescriptions)
        break
      default:
        throw new Error(`Invalid 'Prescription Treatment Type', must be one of: ${validFhirPrescriptionTreatmentTypes.join(", ")}`)
    }
  })
  return prescriptions
}

const validFhirPrescriptionTreatmentTypes = ["acute", "repeat-prescribing", "repeat-dispensing"]

function createAcutePrescription(
  patient: BundleEntry,
  prescriber: BundleEntry,
  prescriptionRows: XlsRow[],
  nominatedPharmacy: string,
  prescriptions: any[]
) {
  const prescription = createPrescription(patient, prescriber, prescriptionRows)
  const bundle = JSON.parse(prescription)
  updateNominatedPharmacy(bundle, nominatedPharmacy)
  prescriptions.push(JSON.stringify(bundle))
}

function createRepeatPrescribingPrescriptions(
  prescriptionRow: XlsRow,
  patient: BundleEntry,
  prescriber: BundleEntry,
  prescriptionRows: XlsRow[],
  nominatedPharmacy: string,
  prescriptions: any[]
) {
  const repeatsAllowed = getNumberOfRepeatsAllowed(prescriptionRow)
  for (let repeatsIssued = 0; repeatsIssued <= repeatsAllowed; repeatsIssued++) {
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
}

function createRepeatDispensingPrescription(
  patient: BundleEntry,
  prescriber: BundleEntry,
  prescriptionRows: XlsRow[],
  prescriptionRow: XlsRow,
  nominatedPharmacy: string,
  prescriptions: any[]
) {
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
}

function updateNominatedPharmacy(bundle: Bundle, odsCode: string): void {
  if (!odsCode) {
    return
  }
  getMessageHeaderResources(bundle).forEach(messageHeader => {
    messageHeader.destination.forEach(destination => {
      destination.receiver.identifier.value = odsCode
    })
  })
  getMedicationRequestResources(bundle).forEach(function (medicationRequest) {
    medicationRequest.dispenseRequest.performer = {
      identifier: {
        system: "https://fhir.nhs.uk/Id/ods-organization-code",
        value: odsCode
      }
    }
  })
}

function getPatient(patients: Array<BundleEntry>, prescriptionRow: XlsRow) {
  const testNumber = parseInt(prescriptionRow["Test"])
  return patients[testNumber - 1]
}

function getNominatedPharmacyOdsCode(nominatedPharmacies: Array<string>, prescriptionRow: XlsRow) {
  if (!prescriptionRow["Test"]) {
    return null
  }
  const testNumber = parseInt(prescriptionRow["Test"])
  return nominatedPharmacies[testNumber - 1]
}

function createPrescription(
  patientEntry: BundleEntry,
  practitionerEntry: BundleEntry,
  prescriptionRows: Array<XlsRow>,
  repeatsIssued = 0,
  maxRepeatsAllowed = 0
): string {
  const careSetting = getCareSetting(prescriptionRows)

  const practitionerRoleEntry = DEFAULT_PRACTITIONER_ROLE

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
      createMessageHeader(),
      patientEntry,
      practitionerEntry,
      practitionerRoleEntry,
      createCommunicationRequest(patientEntry)
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

function createPlaceResources(careSetting: string, fhirPrescription: Bundle): void {
  if (careSetting === "Primary-Care") {
    fhirPrescription.entry.push({
      fullUrl: "urn:uuid:3b4b03a5-52ba-4ba6-9b82-70350aa109d8",
      resource: {
        resourceType: "Organization",
        identifier: [
          {
            system: "https://fhir.nhs.uk/Id/ods-organization-code",
            value: "A83008"
          }
        ],
        type: [
          {
            coding: [
              {
                system: "https://fhir.nhs.uk/CodeSystem/organisation-role",
                code: "76",
                display: "GP PRACTICE"
              }
            ]
          }
        ],
        name: "HALLGARTH SURGERY",
        address: [
          {
            use: "work",
            type: "both",
            line: ["HALLGARTH SURGERY", "CHEAPSIDE"],
            city: "SHILDON",
            district: "COUNTY DURHAM",
            postalCode: "DL4 2HP"
          }
        ],
        telecom: [
          {
            system: "phone",
            value: "0115 9737320",
            use: "work"
          }
        ],
        partOf: {
          identifier: {
            system: "https://fhir.nhs.uk/Id/ods-organization-code",
            value: "84H"
          },
          display: "NHS COUNTY DURHAM CCG"
        }
      } as Organization
    })
  } else if (careSetting === "Secondary-Care" || careSetting === "Homecare") {
    fhirPrescription.entry.push({
      fullUrl: "urn:uuid:3b4b03a5-52ba-4ba6-9b82-70350aa109d8",
      resource: {
        resourceType: "Organization",
        id: "3b4b03a5-52ba-4ba6-9b82-70350aa109d8",
        identifier: [
          {
            system: "https://fhir.nhs.uk/Id/ods-organization-code",
            value: "RBA"
          }
        ],
        type: [
          {
            coding: [
              {
                system: "https://fhir.nhs.uk/CodeSystem/organisation-role",
                code: "197",
                display: "NHS TRUST"
              }
            ]
          }
        ],
        name: "TAUNTON AND SOMERSET NHS FOUNDATION TRUST",
        address: [
          {
            line: ["MUSGROVE PARK HOSPITAL", "PARKFIELD DRIVE", "TAUNTON"],
            postalCode: "TA1 5DA"
          }
        ],
        telecom: [
          {
            system: "phone",
            value: "01823333444",
            use: "work"
          }
        ]
      } as Organization
    })
    fhirPrescription.entry.push({
      fullUrl: "urn:uuid:54b0506d-49af-4245-9d40-d7d64902055e",
      resource: {
        resourceType: "HealthcareService",
        id: "54b0506d-49af-4245-9d40-d7d64902055e",
        identifier: [
          {
            use: "usual",
            system: "https://fhir.nhs.uk/Id/ods-organization-code",
            value: "A99968"
          }
        ],
        active: true,
        providedBy: {
          identifier: {
            system: "https://fhir.nhs.uk/Id/ods-organization-code",
            value: "RBA"
          }
        },
        location: [
          {
            reference: "urn:uuid:8a5d7d67-64fb-44ec-9802-2dc214bb3dcb"
          }
        ],
        name: "SOMERSET BOWEL CANCER SCREENING CENTRE",
        telecom: [
          {
            system: "phone",
            value: "01823 333444",
            use: "work"
          }
        ]
      } as HealthcareService
    })
    fhirPrescription.entry.push({
      fullUrl: "urn:uuid:8a5d7d67-64fb-44ec-9802-2dc214bb3dcb",
      resource: {
        resourceType: "Location",
        id: "8a5d7d67-64fb-44ec-9802-2dc214bb3dcb",
        identifier: [
          {
            value: "10008800708"
          }
        ],
        status: "active",
        mode: "instance",
        address: {
          use: "work",
          line: ["MUSGROVE PARK HOSPITAL"],
          city: "TAUNTON",
          postalCode: "TA1 5DA"
        }
      } as fhir4.Location
    })
  }
}

function createMessageHeader(): BundleEntry {
  return {
    fullUrl: "urn:uuid:aef77afb-7e3c-427a-8657-2c427f71a272",
    resource: {
      resourceType: "MessageHeader",
      id: "3599c0e9-9292-413e-9270-9a1ef1ead99c",
      eventCoding: {
        system: "https://fhir.nhs.uk/CodeSystem/message-event",
        code: "prescription-order",
        display: "Prescription Order"
      },
      sender: {
        identifier: {
          system: "https://fhir.nhs.uk/Id/ods-organization-code",
          value: "RBA"
        },
        reference: "urn:uuid:56166769-c1c4-4d07-afa8-132b5dfca666",
        display: "RAZIA|ALI"
      },
      source: {
        endpoint: "urn:nhs-uk:addressing:ods:RBA"
      },
      destination: [
        {
          endpoint: `https://int.api.service.nhs.uk/electronic-prescriptions/$post-message`,
          receiver: {
            identifier: {
              system: "https://fhir.nhs.uk/Id/ods-organization-code",
              value: "X26"
            }
          }
        }
      ],
      focus: []
    } as MessageHeader
  }
}

type TreatmentType = "acute" | "continuous" | "continuous-repeat-dispensing"

function getPrescriptionTreatmentTypeCode(row: XlsRow): TreatmentType {
  const code = row["Prescription Treatment Type"]
  if (!validFhirPrescriptionTreatmentTypes.includes(code)) {
    // eslint-disable-next-line max-len
    throw new Error(`Prescription Treatment Type column contained an invalid value. 'Prescription Treatment Type' must be one of: ${validFhirPrescriptionTreatmentTypes.join(", ")}`)
  }
  switch (code) {
    case "acute":
      return "acute"
    case "repeat-prescribing":
      return "continuous"
    case "repeat-dispensing":
      return "continuous-repeat-dispensing"
  }
}

function getNumberOfRepeatsAllowed(row: XlsRow) {
  return parseInt(row["Issues"]) - 1
}

function getCareSetting(prescriptionRows: Array<XlsRow>): string {
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
  xlsxRowGroup: Array<XlsRow>,
  repeatsIssued: number,
  maxRepeatsAllowed: number
) {
  return xlsxRowGroup.map((row: XlsRow) => {
    const id = uuid.v4()
    const prescriptionTreatmentType = createPrescriptionType(row) as { code: TreatmentType }
    return {
      fullUrl: `urn:uuid:${id}`,
      resource: {
        resourceType: "MedicationRequest",
        id: id,
        basedOn: prescriptionTreatmentType.code === "continuous"
          ? [
            {
              extension: [
                {
                  url: "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation",
                  extension: [
                    {
                      url: "numberOfRepeatsAllowed",
                      valueUnsignedInt: maxRepeatsAllowed
                    }
                  ]
                }
              ],
              identifier: {
                system: "https://fhir.nhs.uk/Id/prescription-order-item-number",
                value: id
              }
            }
          ]
          : [],
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
            prescriptionTreatmentType
          ]
        },
        dosageInstruction: [
          {
            text: getDosageInstructionText(row)
          }
        ],
        dispenseRequest: getDispenseRequest(row, maxRepeatsAllowed),
        substitution: {
          allowedBoolean: false
        }
      }
    } as BundleEntry
  })
}

function getDispenseRequest(row: XlsRow, numberOfRepeatsAllowed: number): MedicationRequestDispenseRequest {
  const prescriptionTreatmentTypeCode = getPrescriptionTreatmentTypeCode(row)

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
        value: 30,
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

function getDosageInstructionText(row: XlsRow): string {
  return row["Dosage Instructions"]
    ? row["Dosage Instructions"]
    : "As directed"
}

function getMedicationSnomedCode(row: XlsRow): string {
  return row["Snomed"].toString()
}

function getMedicationDisplay(row: XlsRow): string {
  return row["Medication"]
}

function getMedicationRequestExtensions(row: XlsRow, prescriptionTreatmentTypeCode: TreatmentType, repeatsIssued: number): Array<Extension> {
  const prescriptionTypeCode = row["Prescription Type"].toString()
  const prescriberTypeDisplay = row["Prescriber Description"]
  const extension: Array<Extension> = [
    {
      url:
        "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType",
      valueCoding: {
        system: "https://fhir.nhs.uk/CodeSystem/prescription-type",
        code: prescriptionTypeCode,
        display: prescriberTypeDisplay
      }
    }
  ]

  if (prescriptionTreatmentTypeCode !== "acute") {
    extension.push(createRepeatInformationExtensions(prescriptionTreatmentTypeCode, repeatsIssued))
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
    })
  )

  return extension
}

function createPrescriptionType(row: XlsRow): any {
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

function createRepeatInformationExtensions(
  prescriptionTreatmentTypeCode: TreatmentType,
  repeatsIssued: number
): { url: string, extension: Extension[] } {
  const extension: Array<Extension> = [
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

function getMedicationQuantity(row: XlsRow): Quantity {
  return {
    value: parseInt(row["Qty"]),
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
