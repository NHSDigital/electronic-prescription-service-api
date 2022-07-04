import * as XLSX from "xlsx"
import * as fhir from "fhir/r4"
import {getMedicationRequestResources, getMessageHeaderResources} from "../../fhir/bundleResourceFinder"
import {Dispatch, SetStateAction} from "react"
import {createPatients, getPatient} from "./patients"
import {createPractitioners, getPractitioner} from "./practitioners"
import {
  getRowsFromSheet,
  parseOrganisationRowsOrDefault,
  parseParentOrganisationRowsOrDefault as parseAccountRowsOrDefault,
  parsePatientRowsOrDefault,
  parsePrescriptionRows,
  PrescriptionRow
} from "./xls"
import {getPractitionerRole, createPractitionerRoles} from "./practitionerRoles"
import {createCommunicationRequest} from "./communicationRequests"
import {createMessageHeader} from "./messageHeader"
import {createPlaceResources} from "./placeResources"
import {createMedicationRequests} from "./medicationRequests"
import {groupBy} from "./helpers"

export const createPrescriptionsFromExcelFile = (
  file: Blob,
  setPrescriptionsInTestPack: Dispatch<SetStateAction<any[]>>,
  setLoadPageErrors: Dispatch<SetStateAction<any>>
): void => {
  const reader = new FileReader()

  reader.onload = function (e) {
    const data = e.target.result
    const workbook = XLSX.read(data, {
      type: "binary"
    })

    const prescriptionRows = parsePrescriptionRows(getRowsFromSheet("Prescriptions", workbook), setLoadPageErrors)
    const patientRows = parsePatientRowsOrDefault(getRowsFromSheet("Patients", workbook, false), prescriptionRows.length)
    const prescriberRows = getRowsFromSheet("Prescribers", workbook, false)
    const organisationRows = parseOrganisationRowsOrDefault(getRowsFromSheet("Organisations", workbook, false), prescriptionRows.length)
    const parentOrganisationRows = parseAccountRowsOrDefault(getRowsFromSheet("Accounts", workbook, false), prescriptionRows.length)
    const patients = createPatients(patientRows)
    const practitioners = createPractitioners(prescriberRows)
    const practitionerRoles = createPractitionerRoles(prescriberRows)
    const places = createPlaceResources(prescriptionRows, organisationRows, parentOrganisationRows)

    setPrescriptionsInTestPack(
      createPrescriptions(
        patients,
        practitioners,
        practitionerRoles,
        places,
        prescriptionRows,
        setLoadPageErrors
      )
    )
  }

  reader.onerror = function (ex) {
    console.log(ex)
  }

  reader.readAsBinaryString(file)
}

function createPrescriptions(
  patients: Array<fhir.BundleEntry>,
  practitioners: Array<fhir.BundleEntry>,
  practitionerRoles: Array<fhir.BundleEntry>,
  places: Array<Array<fhir.BundleEntry>>,
  rows: Array<PrescriptionRow>,
  setLoadPageErrors: Dispatch<SetStateAction<any>>
): any[] {
  const prescriptions = []
  const tests = groupBy(rows, (row: PrescriptionRow) => row.testId)

  tests.forEach((medicationItemRows, key) => {
    const prescriptionRow = medicationItemRows[0]
    const prescriptionType = getPrescriptionType(prescriptionRow.prescriptionTypeCode)
    const patient = getPatient(patients, prescriptionRow)
    const pracitioner = getPractitioner(practitioners, prescriptionRow)
    const nominatedPharmacy = prescriptionRow.nominatedPharmacy

    const prescriptionTreatmentTypeCode = getPrescriptionTreatmentType(prescriptionRow, setLoadPageErrors)
    const index = parseInt(key) - 1
    switch (prescriptionTreatmentTypeCode) {
      case "acute":
        createAcutePrescription(prescriptionType, patient, pracitioner, places[index], medicationItemRows, nominatedPharmacy, prescriptions)
        break
      case "continuous":
        createRepeatPrescribingPrescriptions(prescriptionType, patient, pracitioner, places[index], medicationItemRows, nominatedPharmacy, prescriptions)
        break
      case "continuous-repeat-dispensing":
        createRepeatDispensingPrescription(prescriptionType, patient, pracitioner, places[index], medicationItemRows, nominatedPharmacy, prescriptions)
        break
      default:
        throw new Error(`Invalid 'Prescription Treatment Type', must be one of: ${validFhirPrescriptionTypes.join(", ")}`)
    }
  })
  return prescriptions
}

const validFhirPrescriptionTypes = ["acute", "repeat-prescribing", "repeat-dispensing"]

function createAcutePrescription(
  prescriptionType: PrescriptionType,
  patient: fhir.BundleEntry,
  practitioner: fhir.BundleEntry,
  places: Array<fhir.BundleEntry>,
  prescriptionRows: PrescriptionRow[],
  nominatedPharmacy: string,
  prescriptions: any[]
) {
  const prescription = createPrescription(prescriptionType, patient, practitioner, places, prescriptionRows)
  const bundle = JSON.parse(prescription)
  updateNominatedPharmacy(bundle, nominatedPharmacy)
  prescriptions.push(JSON.stringify(bundle))
}

function createRepeatPrescribingPrescriptions(
  prescriptionType: PrescriptionType,
  patient: fhir.BundleEntry,
  practitioner: fhir.BundleEntry,
  places: Array<fhir.BundleEntry>,
  prescriptionRows: PrescriptionRow[],
  nominatedPharmacy: string,
  prescriptions: any[]
) {
  const prescriptionRow = prescriptionRows[0]
  const repeatsAllowed = prescriptionRow.repeatsAllowed
  for (let repeatsIssued = 0; repeatsIssued <= repeatsAllowed; repeatsIssued++) {
    const prescription = createPrescription(
      prescriptionType,
      patient,
      practitioner,
      places,
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
  prescriptionType: PrescriptionType,
  patient: fhir.BundleEntry,
  practitioner: fhir.BundleEntry,
  places: Array<fhir.BundleEntry>,
  prescriptionRows: Array<PrescriptionRow>,
  nominatedPharmacy: string,
  prescriptions: any[]
) {
  const prescriptionRow = prescriptionRows[0]
  const prescription = createPrescription(
    prescriptionType,
    patient,
    practitioner,
    places,
    prescriptionRows,
    0,
    prescriptionRow.repeatsAllowed
  )
  const bundle = JSON.parse(prescription)
  updateNominatedPharmacy(bundle, nominatedPharmacy)
  prescriptions.push(JSON.stringify(bundle))
}

function createPrescription(
  prescriptionType: PrescriptionType,
  patient: fhir.BundleEntry,
  practitioner: fhir.BundleEntry,
  places: Array<fhir.BundleEntry>,
  prescriptionRows: Array<PrescriptionRow>,
  repeatsIssued = 0,
  maxRepeatsAllowed = 0
): string {

  const practitionerRole = getPractitionerRole([practitioner], prescriptionRows[0])

  if (prescriptionType === "trust-site-code") {
    (practitionerRole.resource as fhir.PractitionerRole).healthcareService = [
      {
        reference: "urn:uuid:54b0506d-49af-4245-9d40-d7d64902055e"
      }
    ]
  }

  const fhirPrescription: fhir.Bundle = {
    resourceType: "Bundle",
    id: prescriptionRows[0].testId,
    identifier: {
      system: "https://tools.ietf.org/html/rfc4122",
      value: "ea66ee9d-a981-432f-8c27-6907cbd99219"
    },
    type: "message",
    entry: [
      createMessageHeader(),
      patient,
      practitioner,
      practitionerRole,
      createCommunicationRequest(patient)
    ]
  }

  createMedicationRequests(
    prescriptionRows,
    repeatsIssued,
    maxRepeatsAllowed
  ).forEach(medicationRequest =>
    fhirPrescription.entry.push(medicationRequest)
  )

  fhirPrescription.entry = [
    ...fhirPrescription.entry,
    ...places
  ]

  return JSON.stringify(fhirPrescription)
}

export function getPrescriptionTreatmentType(row: PrescriptionRow, setLoadPageErrors?: Dispatch<SetStateAction<any>>): TreatmentType {
  const code = row.prescriptionTreatmentTypeCode
  if (!validFhirPrescriptionTypes.includes(code)) {
    // eslint-disable-next-line max-len
    const treatmentTypeInvalidError = `Treatment Type column contained an invalid value. 'Prescription Type' must be one of: ${validFhirPrescriptionTypes.join(", ")}`
    if (setLoadPageErrors) {
      setLoadPageErrors({details: [treatmentTypeInvalidError]})
    }
    throw new Error(treatmentTypeInvalidError)
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

function updateNominatedPharmacy(bundle: fhir.Bundle, odsCode: string): void {
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

export type TreatmentType = "acute" | "continuous" | "continuous-repeat-dispensing"

export type PrescriptionType = "prescribing-cost-centre-0101" | "prescribing-cost-centre-non-0101" | "trust-site-code"

export function getPrescriptionType(prescriberType: string): PrescriptionType {
  if (prescriberType.startsWith("10")) {
    return "trust-site-code"
  }

  switch (prescriberType) {
    case "0101":
      return "prescribing-cost-centre-0101"
    default:
      return "prescribing-cost-centre-non-0101"
  }
}
