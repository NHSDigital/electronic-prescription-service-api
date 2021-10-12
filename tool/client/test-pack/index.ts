import * as XLSX from "xlsx"
import * as uuid from "uuid"
import moment from "moment"
import * as fhirCommon from "../models/common"
import * as fhirExtension from "../models/extension"
import {
  MessageHeader,
  Bundle,
  BundleEntry,
  Practitioner,
  PractitionerRole,
  CommunicationRequest,
  Organization,
  HealthcareService,
  Location,
  MedicationRequestDispenseRequest
} from "../models"
import {getNhsNumber} from "../parsers/read/patient-parser"
import {convertMomentToISODate} from "../lib/date-time"
import {pageData} from "../ui/state"

export function initialiseTestPack(): void {
  document
    .getElementById("prescription-test-pack")
    .addEventListener("change", handleFileSelect, false)
}

function handleFileSelect(evt: Event) {
  const files = (evt.target as HTMLInputElement).files
  parseExcel(files[0])
}

const parseExcel = (file: Blob) => {
  const reader = new FileReader()

  reader.onload = function (e) {
    const data = e.target.result
    const workbook = XLSX.read(data, {
      type: "binary"
    })
 
    const patientSheet = workbook.Sheets["Patients"]
    if (!patientSheet) throw new Error("Could not find a sheet called 'Patients'")
    //eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const patientRows = XLSX.utils.sheet_to_row_object_array(patientSheet)
    
    const prescriptionsSheet = workbook.Sheets["Prescriptions"]
    if (!prescriptionsSheet) throw new Error("Could not find a sheet called 'Prescriptions'")
    //eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const prescriptionRows = XLSX.utils.sheet_to_row_object_array(prescriptionsSheet)

    const patients = createPatients(patientRows)
    createPrescriptions(patients, prescriptionRows)
  }

  reader.onerror = function (ex) {
    console.log(ex)
  }

  reader.readAsBinaryString(file)
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
                      system:
                        "https://fhir.hl7.org.uk/CodeSystem/UKCore-NHSNumberVerificationStatus",
                      code: "01",
                      display: "Number present and verified"
                    }
                  ]
                }
              }
            ],
            system: "https://fhir.nhs.uk/Id/nhs-number",
            value: row["NHS_NUMBER"]
          }
        ],
        name: [
          {
            use: "usual",
            family: row["FAMILY_NAME"],
            given: [
              //row["OTHER_GIVEN_NAME"], - todo, null handling
              row["GIVEN_NAME"]
            ],
            prefix: [row["TITLE"]]
          }
        ],
        gender: getGender(row),
        birthDate: `${row["DATE_OF_BIRTH"].toString().substring(0, 4)}-${row[
          "DATE_OF_BIRTH"
        ].toString().substring(4, 6)}-${row["DATE_OF_BIRTH"].toString().substring(6)}`,
        address: [
          {
            use: "home",
            line: [
              //row["ADDRESS_LINE_1"], todo null handling
              row["ADDRESS_LINE_2"],
              //row["ADDRESS_LINE_3"],
              row["ADDRESS_LINE_4"]
              //row["ADDRESS_LINE_5"]
            ],
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
      }
    }
  })
}

function createPrescriptions(patients: Array<BundleEntry>, rows: Array<StringKeyedObject>) {
  pageData.payloads = []
  const prescriptionRows = groupBy(rows, (row: StringKeyedObject) => row["Test"])
  prescriptionRows.forEach(prescriptionRows => {
    const prescription = prescriptionRows[0]

    if (
      getPrescriptionTreatmentTypeCode(prescription) === "continuous"
    ) {
      const repeatsAllowed = getNumberOfRepeatsAllowed(prescription)
      for (
        let repeatsIssued = 0;
        repeatsIssued < repeatsAllowed;
        repeatsIssued++
      ) {
        pageData.payloads.push(
          createPrescription(
            patients,
            prescriptionRows,
            repeatsIssued,
            repeatsAllowed
          )
        )
      }
    } else {
      pageData.payloads.push(createPrescription(patients, prescriptionRows))
    }
  })
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

// todo: move this code to new column in test-pack or can we do snomed lookups?
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
      return "999999999"
  }
}

function getPatient(patients: Array<BundleEntry>, prescriptionRows: Array<StringKeyedObject>) {
  const prescription = prescriptionRows[0]
  const testNumber = parseInt(prescription["Test"])
  return patients[testNumber - 1]
}

function createPrescription(
  patients: Array<BundleEntry>,
  prescriptionRows: Array<StringKeyedObject>,
  repeatsIssued = 0,
  maxRepeatsAllowed = 0
): string {
  const careSetting = getCareSetting(prescriptionRows)

  const fhirPatient = getPatient(patients, prescriptionRows)

  const fhirPractitionerRole: BundleEntry = {
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

  if (careSetting === "Secondary-Care") {
    (fhirPractitionerRole.resource as PractitionerRole).healthcareService = [
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
      {
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
              endpoint: `https://${pageData.environment === "int" ? "int." : ""
              }api.service.nhs.uk/electronic-prescriptions/$post-message`,
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
      },
      fhirPatient,
      fhirPractitionerRole,
      {
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
      },
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
              value: "RBA" // todo: remove hardcoded
            }
          },
          recipient: [
            {
              type: "Patient",
              identifier: {
                system: "https://fhir.nhs.uk/Id/nhs-number",
                value: getNhsNumber(fhirPatient)
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
      throw new Error("Unable to determine care-setting")
  }
}

function createPlaceResources(careSetting: string, fhirPrescription: Bundle) {
  if (careSetting === "Primary-Care" || careSetting === "Homecare") {
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
  } else if (careSetting === "Secondary-Care") {
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
        active: "true",
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
      } as Location
    })
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
            createPrescriptionType(
              getPrescriptionTreatmentTypeSystem(row),
              getPrescriptionTreatmentTypeCode(row)
            )
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
  // todo: remove magic strings
  if (prescriptionTreatmentTypeCode === "continuous"
    || prescriptionTreatmentTypeCode === "continuous-repeat-dispensing") {
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
  return row["Snomed"]
}

function getMedicationDisplay(row: StringKeyedObject): string {
  return row["Medication"]
}

function getMedicationRequestExtensions(row: StringKeyedObject, repeatsIssued: number, maxRepeatsAllowed: number): Array<fhirExtension.Extension> {
  const prescriptionTypeCode = row["Prescription Type"]
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

interface StringKeyedObject {
  [k: string]: string
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

function getPrescriptionTreatmentTypeSystem(row: StringKeyedObject): string {
  const firstPart = row["Prescription Treatment Type"]
  if (firstPart === "acute")
    return "http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy"
  else {
    return "https://fhir.nhs.uk/CodeSystem/medicationrequest-course-of-therapy"
  }
}

function getNumberOfRepeatsAllowed(row: StringKeyedObject) {
  return parseInt(row["Issues"])
}

function createPrescriptionType(system: string, code: string): any {
  return {
    system,
    code
  }
}
