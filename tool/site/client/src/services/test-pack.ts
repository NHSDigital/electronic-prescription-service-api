import * as XLSX from "xlsx"
import {
  Bundle,
  BundleEntry,
  CommunicationRequest,
  Extension,
  HealthcareService,
  MedicationRequestDispenseRequest,
  MessageHeader,
  Organization,
  Patient,
  Practitioner,
  PractitionerRole,
  Quantity
} from "fhir/r4"
import {getMedicationRequestResources, getMessageHeaderResources} from "../fhir/bundleResourceFinder"
import {convertMomentToISODate} from "../formatters/dates"
import * as uuid from "uuid"
import * as moment from "moment"
import {Dispatch, SetStateAction} from "react"

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
    const prescribers = createPrescribers(prescriberRows)
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

function createPatients(rows: Array<StringKeyedObject>): Array<BundleEntry> {
  return rows.map(row => {
    return {
      fullUrl: "urn:uuid:78d3c2eb-009e-4ec8-a358-b042954aa9b2",
      resource: {
        resourceType: "Patient",
        identifier: [
          {
            extension: [
              {
                url:
                  "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-NHSNumberVerificationStatus",
                valueCodeableConcept: {
                  coding: [
                    {
                      system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-NHSNumberVerificationStatus",
                      code: "number-present-and-verified",
                      display: "Number present and verified"
                    }
                  ]
                }
              }
            ],
            system: "https://fhir.nhs.uk/Id/nhs-number",
            value: row["NHS_NUMBER"].toString()
          }
        ],
        name: [
          {
            use: "usual",
            family: row["FAMILY_NAME"],
            given: getGivenName(row),
            prefix: [row["TITLE"]]
          }
        ],
        gender: getGender(row),
        birthDate: getBirthDate(row),
        address: [
          {
            use: "home",
            line: getAddressLines(row),
            postalCode: row["POST_CODE"]
          }
        ],
        generalPractitioner: [
          {
            identifier: {
              system: "https://fhir.nhs.uk/Id/ods-organization-code",
              value: "A83008"
            }
          }
        ]
      } as Patient
    }
  })
}

function getGivenName(row: StringKeyedObject): string[] {
  return [
    row["OTHER_GIVEN_NAME"],
    row["GIVEN_NAME"]
  ].filter(Boolean)
}

function getGender(row: StringKeyedObject) {
  const gender = row["GENDER"].toLowerCase()
  if (gender === "indeterminate") {
    return "other"
  }
  if (gender === "not known") {
    return "unknown"
  }
  return gender
}

function getBirthDate(row: StringKeyedObject): string {
  return `${row["DATE_OF_BIRTH"].toString().substring(0, 4)}`
    + `-${row["DATE_OF_BIRTH"].toString().substring(4, 6)}`
    + `-${row["DATE_OF_BIRTH"].toString().substring(6)}`
}

function getAddressLines(row: StringKeyedObject): string[] {
  return [
    row["ADDRESS_LINE_1"],
    row["ADDRESS_LINE_2"],
    row["ADDRESS_LINE_3"],
    row["ADDRESS_LINE_4"]
  ].filter(Boolean)
}

interface StringKeyedObject {
  [k: string]: string
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

function createPrescribers(rows: Array<StringKeyedObject>): Array<BundleEntry> {
  return rows.map(row => {
    const professionalCode = row["Professional Code"].toString()
    const professionalCodeType = row["Professional Code Type"]
    const prescribingCode = row["Prescribing Code"]?.toString()
    const prescribingCodeType = row["Prescribing Code Type"]?.toString()

    const practitionerIdentifier = [
      {
        system: "https://fhir.nhs.uk/Id/sds-user-id",
        value: "7020134158"
      }
    ]

    let professionalCodeSystem = ""
    switch (professionalCodeType) {
      case "GMC":
        professionalCodeSystem = "https://fhir.hl7.org.uk/Id/gmc-number"
        break
      case "NMC":
        professionalCodeSystem = "https://fhir.hl7.org.uk/Id/nmc-number"
        break
      case "GPHC":
        professionalCodeSystem = "https://fhir.hl7.org.uk/Id/gphc-number"
        break
      case "GMP":
        professionalCodeSystem = "https://fhir.hl7.org.uk/Id/gmp-number"
        break
      case "HCPC":
        professionalCodeSystem = "https://fhir.hl7.org.uk/Id/hcpc-number"
        break
      case "Unknown":
        professionalCodeSystem = "https://fhir.hl7.org.uk/Id/professional-code"
        break
      default:
        throw new Error(`Professional Code Type has invalid value: '${professionalCodeType}'`)
    }

    practitionerIdentifier.push({
      system: professionalCodeSystem,
      value: professionalCode
    })

    switch (prescribingCodeType) {
      case "DIN":
        practitionerIdentifier.push({
          system: "https://fhir.hl7.org.uk/Id/din-number",
          value: prescribingCode
        })
        break
    }

    return {
      fullUrl: "urn:uuid:a8c85454-f8cb-498d-9629-78e2cb5fa47a",
      resource: {
        resourceType: "Practitioner",
        id: "a8c85454-f8cb-498d-9629-78e2cb5fa47a",
        identifier: practitionerIdentifier,
        name: [
          {
            text: row["Prescriber Name"]
          }
        ]
      } as Practitioner
    }
  })
}

function getDefaultPractitionerBundleEntry(): BundleEntry {
  return {
    fullUrl: "urn:uuid:a8c85454-f8cb-498d-9629-78e2cb5fa47a",
    resource: {
      resourceType: "Practitioner",
      id: "a8c85454-f8cb-498d-9629-78e2cb5fa47a",
      identifier: [
        {
          system: "https://fhir.nhs.uk/Id/sds-user-id",
          value: "7020134158"
        },
        {
          system: "https://fhir.hl7.org.uk/Id/gmc-number",
          value: "G9999999"
        },
        {
          system: "https://fhir.hl7.org.uk/Id/din-number",
          value: "70201123456"
        }
      ],
      name: [
        {
          family: "Edwards",
          given: ["Thomas"],
          prefix: ["DR"]
        }
      ]
    } as Practitioner
  }
}

function createNominatedPharmacies(rows: Array<StringKeyedObject>): Array<string> {
  return rows.map(row => row["ODS Code"])
}

function createPrescriptions(
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
    const prescriber = getPractitionerBundleEntry(prescribers, prescriptionRow)
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
  prescriptionRows: StringKeyedObject[],
  nominatedPharmacy: string,
  prescriptions: any[]
) {
  const prescription = createPrescription(patient, prescriber, prescriptionRows)
  const bundle = JSON.parse(prescription)
  updateNominatedPharmacy(bundle, nominatedPharmacy)
  prescriptions.push(JSON.stringify(bundle))
}

function createRepeatPrescribingPrescriptions(
  prescriptionRow: StringKeyedObject,
  patient: BundleEntry,
  prescriber: BundleEntry,
  prescriptionRows: StringKeyedObject[],
  nominatedPharmacy: string,
  prescriptions: any[]
) {
  const repeatsAllowed = getNumberOfRepeatsAllowed(prescriptionRow)
  for (let repeatsIssued = 1; repeatsIssued <= repeatsAllowed; repeatsIssued++) {
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
  prescriptionRows: StringKeyedObject[],
  prescriptionRow: StringKeyedObject,
  nominatedPharmacy: string,
  prescriptions: any[]
) {
  const prescription = createPrescription(
    patient,
    prescriber,
    prescriptionRows,
    1,
    parseInt(prescriptionRow["Issues"])
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

function getPatientBundleEntry(patients: Array<BundleEntry>, prescriptionRow: StringKeyedObject) {
  const testNumber = parseInt(prescriptionRow["Test"])
  return patients[testNumber - 1]
}

function getPractitionerBundleEntry(prescribers: Array<BundleEntry>, prescriptionRow: StringKeyedObject) {
  if (prescribers) {
    return getDefaultPractitionerBundleEntry()
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
  repeatsIssued = 1,
  maxRepeatsAllowed = 1
): string {
  const careSetting = getCareSetting(prescriptionRows)

  const practitionerRoleEntry: BundleEntry = {
    fullUrl: "urn:uuid:56166769-c1c4-4d07-afa8-132b5dfca666",
    resource: {
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
    } as PractitionerRole
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
      practitionerEntry,
      practitionerRoleEntry,
      {
        fullUrl: "urn:uuid:51793ac0-112f-46c7-a891-9af8cefb206e",
        resource: {
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
              value: "RBA"
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
        } as CommunicationRequest
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

function getNhsNumber(fhirPatient: BundleEntry): string {
  return (fhirPatient.resource as Patient).identifier.filter(
    i => i.system === "https://fhir.nhs.uk/Id/nhs-number"
  )[0].value
}

function createMessageHeaderEntry(): BundleEntry {
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

function getPrescriptionTreatmentTypeCode(row: StringKeyedObject): string {
  const code = row["Prescription Treatment Type"].split(" ")[0]
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
    const prescriptionTreatmentType = createPrescriptionType(row)
    const intent = "order"
    return {
      fullUrl: `urn:uuid:${id}`,
      resource: {
        resourceType: "MedicationRequest",
        id: id,
        extension: getMedicationRequestExtensions(
          row,
          prescriptionTreatmentType.code,
          repeatsIssued,
          intent
        ),
        identifier: [
          {
            system: "https://fhir.nhs.uk/Id/prescription-order-item-number",
            value: id
          }
        ],
        status: "active",
        intent: intent,
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

function getDispenseRequest(row: StringKeyedObject, maxRepeatsAllowed: number): MedicationRequestDispenseRequest {
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
        value: 30,
        unit: "day",
        system: "http://unitsofmeasure.org",
        code: "d"
      },
      numberOfRepeatsAllowed: maxRepeatsAllowed - 1
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

function getMedicationRequestExtensions(row: StringKeyedObject, prescriptionTreatmentTypeCode: any, repeatsIssued: number, intent: string): Array<Extension> {
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

  if (prescriptionTreatmentTypeCode === "continous"
  || (prescriptionTreatmentTypeCode === "continous-repeat-dispensing" && intent === "reflex-order")) {
    extension.push(createRepeatInformationExtensions(repeatsIssued))
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

function createRepeatInformationExtensions(
  repeatsIssued: number
): {url: string, extension: Extension[]} {
  const extension: Array<Extension> = [
    {
      url: "authorisationExpiryDate",
      // todo: work this out from "days treatment"
      valueDateTime: new Date(2025, 1, 1).toISOString().slice(0, 10)
    }
  ]
  extension.push({
    url: "numberOfPrescriptionsIssued",
    valueUnsignedInt: repeatsIssued
  })
  return {
    url:
      "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
    extension: extension
  }
}

function getMedicationQuantity(row: StringKeyedObject): Quantity {
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
