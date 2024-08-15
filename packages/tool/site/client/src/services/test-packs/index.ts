import * as XLSX from "xlsx"
import * as fhir from "fhir/r4"
import {getMedicationRequestResources, getMessageHeaderResources} from "../../fhir/bundleResourceFinder"
import {Dispatch, SetStateAction} from "react"
import {createPatient} from "./patients"
import {createPractitioner} from "./practitioners"
import {
  getRowsFromSheet,
  parseOrganisationRowsOrDefault,
  parseAccountRowsOrDefault,
  parsePatientRowsOrDefault,
  parsePrescriptionRows,
  PatientRow,
  PrescriptionRow,
  parsePrescriberRowsOrDefault,
  PrescriberRow,
  OrganisationRow,
  AccountRow
} from "./xls"
import {createPractitionerRole} from "./practitionerRoles"
import {createCommunicationRequest} from "./communicationRequests"
import {createMessageHeader} from "./messageHeader"
import {createPlaceResources} from "./placeResources"
import {createMedicationRequests} from "./medicationRequests"
import {groupBy} from "./helpers"

type PrescriptionData = {
  medicationRows: Array<PrescriptionRow>,
  nominatedPharmacy: string,
  nominatedPharmacyType: string,
  patient: fhir.BundleEntry,
  places: Array<fhir.BundleEntry>,
  practitioner: fhir.BundleEntry,
  practitionerRole: fhir.BundleEntry
}

type PrescriptionCreator = (
  prescriptionData: PrescriptionData,
  prescriptions: Array<fhir.Bundle>
) => void

export const createPrescriptionsFromExcelFile = (
  file: Blob,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setPrescriptionsInTestPack: Dispatch<SetStateAction<Array<any>>>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setLoadPageErrors: Dispatch<SetStateAction<any>>
): void => {
  // eslint-disable-next-line no-undef
  const reader = new FileReader()

  reader.onload = function (e) {
    const data = e.target.result
    const workbook = XLSX.read(data, {
      type: "binary"
    })

    const medicationRows = parsePrescriptionRows(getRowsFromSheet("Prescriptions", workbook), setLoadPageErrors)
    const patientRows = parsePatientRowsOrDefault(getRowsFromSheet("Patients", workbook, false), medicationRows.length)
    // eslint-disable-next-line max-len
    const prescriberRows = parsePrescriberRowsOrDefault(getRowsFromSheet("Prescribers", workbook, false), medicationRows.length)
    // eslint-disable-next-line max-len
    const organisationRows = parseOrganisationRowsOrDefault(getRowsFromSheet("Organisations", workbook, false), medicationRows.length)
    const accountRows = parseAccountRowsOrDefault(getRowsFromSheet("Accounts", workbook, false), medicationRows.length)

    setPrescriptionsInTestPack(
      createPrescriptions(
        patientRows,
        prescriberRows,
        organisationRows,
        accountRows,
        medicationRows,
        setLoadPageErrors
      ).map(prescription => JSON.stringify(prescription))
    )
  }

  reader.onerror = function (ex) {
    console.log(ex)
  }

  reader.readAsBinaryString(file)
}

function createPrescriptions(
  patientRows: Map<string, PatientRow>,
  prescriberRows: Map<string, PrescriberRow>,
  organisationRows: Map<string, OrganisationRow>,
  accountRows: Map<string, AccountRow>,
  medicationRows: Array<PrescriptionRow>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setLoadPageErrors: Dispatch<SetStateAction<any>>
): Array<fhir.Bundle> {
  const prescriptions: Array<fhir.Bundle> = []

  const prescriptionRows = groupBy(medicationRows, (row: PrescriptionRow) => row.testId)

  prescriptionRows.forEach((medicationRows, testId) => {
    const accountRow = accountRows.get(testId)
    const organisationRow = organisationRows.get(testId)
    const prescriberRow = prescriberRows.get(testId)
    const prescriptionRow = medicationRows[0]

    const prescriptionData: PrescriptionData = {
      medicationRows: medicationRows,
      nominatedPharmacy: prescriptionRow.nominatedPharmacy,
      nominatedPharmacyType: prescriptionRow.nominatedPharmacyType,
      patient: createPatient(patientRows.get(testId)),
      places: createPlaceResources(organisationRow, accountRow),
      practitioner: createPractitioner(prescriberRow),
      practitionerRole: createPractitionerRole(prescriberRow)
    }

    const prescriptionTreatmentTypeCode = getPrescriptionTreatmentType(prescriptionRow, setLoadPageErrors)

    getCreateFunc(prescriptionTreatmentTypeCode)(prescriptionData, prescriptions)
  })

  return prescriptions
}

function getCreateFunc(prescriptionTreatmentTypeCode: string): PrescriptionCreator {
  switch (prescriptionTreatmentTypeCode) {
    case "acute":
      return createAcutePrescription
    case "continuous":
      return createRepeatPrescribingPrescriptions
    case "continuous-repeat-dispensing":
      return createRepeatDispensingPrescription
    default:
      throw new Error(`Invalid 'Prescription Treatment Type', must be one of: ${validFhirPrescriptionTypes.join(", ")}`)
  }
}

const createAcutePrescription: PrescriptionCreator = (
  prescriptionData: PrescriptionData,
  prescriptions: Array<fhir.Bundle>
) => {
  const prescription = createPrescription(prescriptionData)
  updateNominatedPharmacy(prescription, prescriptionData.nominatedPharmacy)
  updateNominatedPharmacyType(prescription, prescriptionData.nominatedPharmacyType)
  prescriptions.push(prescription)
}

const createRepeatPrescribingPrescriptions: PrescriptionCreator = (
  prescriptionData: PrescriptionData,
  prescriptions: Array<fhir.Bundle>
) => {
  const prescriptionRow = prescriptionData.medicationRows[0]
  const repeatsAllowed = prescriptionRow.repeatsAllowed
  for (let repeatsIssued = 0; repeatsIssued <= repeatsAllowed; repeatsIssued++) {
    const prescription = createPrescription(
      prescriptionData,
      repeatsIssued,
      repeatsAllowed
    )
    updateNominatedPharmacy(prescription, prescriptionData.nominatedPharmacy)
    updateNominatedPharmacyType(prescription, prescriptionData.nominatedPharmacyType)
    prescriptions.push(prescription)
  }
}

const createRepeatDispensingPrescription: PrescriptionCreator = (
  prescriptionData: PrescriptionData,
  prescriptions: Array<fhir.Bundle>
) => {
  const prescriptionRow = prescriptionData.medicationRows[0]
  const prescription = createPrescription(
    prescriptionData,
    0,
    prescriptionRow.repeatsAllowed
  )
  updateNominatedPharmacy(prescription, prescriptionData.nominatedPharmacy)
  updateNominatedPharmacyType(prescription, prescriptionData.nominatedPharmacyType)
  prescriptions.push(prescription)
}

function createPrescription(
  data: PrescriptionData,
  repeatsIssued = 0,
  maxRepeatsAllowed = 0
): fhir.Bundle {

  const prescriptionRow = data.medicationRows[0]

  const fhirPrescription: fhir.Bundle = {
    resourceType: "Bundle",
    id: data.medicationRows[0].testId,
    identifier: {
      system: "https://tools.ietf.org/html/rfc4122",
      value: "ea66ee9d-a981-432f-8c27-6907cbd99219"
    },
    type: "message",
    entry: [
      createMessageHeader(),
      data.patient,
      data.practitioner,
      data.practitionerRole,
      createCommunicationRequest(data.patient, prescriptionRow.additionalInstructions)
    ]
  }

  const resourceType = "Organization"
  const organisation = data.places.map(p => p.resource).find(r => r.resourceType === resourceType) as fhir.Organization
  const odsCode = organisation.identifier.find(i => i.system === "https://fhir.nhs.uk/Id/ods-organization-code").value
  const paddedOdsCode = pad(odsCode, 6)

  createMedicationRequests(
    data.medicationRows,
    paddedOdsCode,
    repeatsIssued,
    maxRepeatsAllowed
  ).forEach(medicationRequest =>
    fhirPrescription.entry.push(medicationRequest)
  )

  fhirPrescription.entry = [
    ...fhirPrescription.entry,
    ...data.places
  ]

  return fhirPrescription
}

function pad(value: string, size: number) {
  value = value.toString()
  while (value.length < size) value = "0" + value
  return value
}

const validFhirPrescriptionTypes = [
  "acute",
  "repeat-dispensing",
  "repeat-prescribing"
]

// eslint-disable-next-line max-len, @typescript-eslint/no-explicit-any
export function getPrescriptionTreatmentType(row: PrescriptionRow, setLoadPageErrors?: Dispatch<SetStateAction<any>>): TreatmentType {
  const code = row.prescriptionTreatmentTypeCode
  if (!validFhirPrescriptionTypes.includes(code)) {
    // eslint-disable-next-line max-len
    const treatmentTypeInvalidError = `Treatment Type column contained an invalid value (${code}). 'Prescription Type' must be one of: ${validFhirPrescriptionTypes.join(", ")}`
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

function updateNominatedPharmacyType(bundle: fhir.Bundle, performerCode: string): void {
  getMedicationRequestResources(bundle).forEach(function (medicationRequest) {
    medicationRequest.dispenseRequest.extension[0].valueCoding.code = performerCode
  })
}

export type TreatmentType = "acute" | "continuous" | "continuous-repeat-dispensing"
