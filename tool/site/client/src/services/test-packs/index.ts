import * as XLSX from "xlsx"
import {
  Bundle,
  BundleEntry,
  PractitionerRole
} from "fhir/r4"
import {getMedicationRequestResources, getMessageHeaderResources} from "../../fhir/bundleResourceFinder"
import {Dispatch, SetStateAction} from "react"
import {createPatients, getPatient} from "./patients"
import {createPractitioners, getPractitioner} from "./practitioners"
import {parsePatientRows, XlsRow} from "./xls"
import {DEFAULT_PRACTITIONER_ROLE} from "./practitionerRoles"
import {createCommunicationRequest} from "./communicationRequests"
import {createMessageHeader} from "./messageHeader"
import {createPlaceResources} from "./locations"
import {createMedicationRequests} from "./medicationRequests"

export const createPrescriptionsFromExcelFile = (file: Blob, setPrescriptionsInTestPack: Dispatch<SetStateAction<any[]>>): void => {
  const reader = new FileReader()

  reader.onload = function (e) {
    const data = e.target.result
    const workbook = XLSX.read(data, {
      type: "binary"
    })

    const patientRows = parsePatientRows(getRowsFromSheet("Patients", workbook))
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

export function getPrescriptionTreatmentTypeCode(row: XlsRow): TreatmentType {
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
  // Prescription Type - Defined by Live Services
  // care setting inferred by related organisation type structure
  if (prescriberTypeCode.startsWith("01")) {
    return "Primary-Care"
  }
  if (prescriberTypeCode.startsWith("10")) {
    return "Secondary-Care"
  }
}

export type TreatmentType = "acute" | "continuous" | "continuous-repeat-dispensing"
