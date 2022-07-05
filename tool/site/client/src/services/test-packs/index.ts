import * as XLSX from "xlsx"
import * as fhir from "fhir/r4"
import {getMedicationRequestResources, getMessageHeaderResources} from "../../fhir/bundleResourceFinder"
import {Dispatch, SetStateAction} from "react"
import {createPatient} from "./patients"
import {createPractitioner} from "./practitioners"
import {
  getRowsFromSheet,
  parseOrganisationRowsOrDefault,
  getAccountRowsOrDefault as parseAccountRowsOrDefault,
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

    const medicationRows = parsePrescriptionRows(getRowsFromSheet("Prescriptions", workbook), setLoadPageErrors)
    const patientRows = parsePatientRowsOrDefault(getRowsFromSheet("Patients", workbook, false), medicationRows.length)
    const prescriberRows = parsePrescriberRowsOrDefault(getRowsFromSheet("Prescribers", workbook, false), medicationRows.length)
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
  patientRows: Array<PatientRow>,
  prescriberRows: Array<PrescriberRow>,
  organisationRows: Array<OrganisationRow>,
  accountRows: Array<AccountRow>,
  medicationRows: Array<PrescriptionRow>,
  setLoadPageErrors: Dispatch<SetStateAction<any>>
): Array<fhir.Bundle> {
  const fhirPrescriptions = []

  const prescriptionRows = groupBy(medicationRows, (row: PrescriptionRow) => row.testId)

  prescriptionRows.forEach((medicationRows, testId) => {

    const prescriptionRow = medicationRows[0]
    const prescriptionType = getPrescriptionType(prescriptionRow.prescriptionTypeCode)
    const patient = createPatient(patientRows.find(r => r.testId === testId))
    const prescriberRow = prescriberRows.find(r => r.testId === testId)
    const practitioner = createPractitioner(prescriberRow)
    const pracitionerRole = createPractitionerRole(prescriberRow)
    const organisationRow = organisationRows.find(r => r.testId === testId)
    const accountRow = accountRows.find(r => r.testId === testId)
    const places = createPlaceResources(prescriptionType, organisationRow, accountRow)
    const nominatedPharmacy = prescriptionRow.nominatedPharmacy

    const prescriptionTreatmentTypeCode = getPrescriptionTreatmentType(prescriptionRow, setLoadPageErrors)

    switch (prescriptionTreatmentTypeCode) {
      case "acute":
        createAcutePrescription(prescriptionType, patient, practitioner, pracitionerRole, places, medicationRows, nominatedPharmacy, fhirPrescriptions)
        break
      case "continuous":
        createRepeatPrescribingPrescriptions(prescriptionType, patient, practitioner, pracitionerRole, places, medicationRows, nominatedPharmacy, fhirPrescriptions)
        break
      case "continuous-repeat-dispensing":
        createRepeatDispensingPrescription(prescriptionType, patient, practitioner, pracitionerRole, places, medicationRows, nominatedPharmacy, fhirPrescriptions)
        break
      default:
        throw new Error(`Invalid 'Prescription Treatment Type', must be one of: ${validFhirPrescriptionTypes.join(", ")}`)
    }
  })

  return fhirPrescriptions
}

const validFhirPrescriptionTypes = ["acute", "repeat-prescribing", "repeat-dispensing"]

function createAcutePrescription(
  prescriptionType: PrescriptionType,
  patient: fhir.BundleEntry,
  practitioner: fhir.BundleEntry,
  practitionerRole: fhir.BundleEntry,
  places: Array<fhir.BundleEntry>,
  medicationRows: PrescriptionRow[],
  nominatedPharmacy: string,
  prescriptions: Array<fhir.Bundle>
) {
  const prescription = createPrescription(prescriptionType, patient, practitioner, practitionerRole, places, medicationRows)
  updateNominatedPharmacy(prescription, nominatedPharmacy)
  prescriptions.push(prescription)
}

function createRepeatPrescribingPrescriptions(
  prescriptionType: PrescriptionType,
  patient: fhir.BundleEntry,
  practitioner: fhir.BundleEntry,
  practitionerRole: fhir.BundleEntry,
  places: Array<fhir.BundleEntry>,
  medicationRows: PrescriptionRow[],
  nominatedPharmacy: string,
  prescriptions: Array<fhir.Bundle>
) {
  const prescriptionRow = medicationRows[0]
  const repeatsAllowed = prescriptionRow.repeatsAllowed
  for (let repeatsIssued = 0; repeatsIssued <= repeatsAllowed; repeatsIssued++) {
    const prescription = createPrescription(
      prescriptionType,
      patient,
      practitioner,
      practitionerRole,
      places,
      medicationRows,
      repeatsIssued,
      repeatsAllowed
    )
    updateNominatedPharmacy(prescription, nominatedPharmacy)
    prescriptions.push(prescription)
  }
}

function createRepeatDispensingPrescription(
  prescriptionType: PrescriptionType,
  patient: fhir.BundleEntry,
  practitioner: fhir.BundleEntry,
  practitionerRole: fhir.BundleEntry,
  places: Array<fhir.BundleEntry>,
  medicationRows: Array<PrescriptionRow>,
  nominatedPharmacy: string,
  prescriptions: Array<fhir.Bundle>
) {
  const prescriptionRow = medicationRows[0]
  const prescription = createPrescription(
    prescriptionType,
    patient,
    practitioner,
    practitionerRole,
    places,
    medicationRows,
    0,
    prescriptionRow.repeatsAllowed
  )
  updateNominatedPharmacy(prescription, nominatedPharmacy)
  prescriptions.push(prescription)
}

function createPrescription(
  prescriptionType: PrescriptionType,
  patient: fhir.BundleEntry,
  practitioner: fhir.BundleEntry,
  practitionerRole: fhir.BundleEntry,
  places: Array<fhir.BundleEntry>,
  medicationRows: Array<PrescriptionRow>,
  repeatsIssued = 0,
  maxRepeatsAllowed = 0
): fhir.Bundle {
  if (prescriptionType === "trust-site-code") {
    (practitionerRole.resource as fhir.PractitionerRole).healthcareService = [
      {
        reference: "urn:uuid:54b0506d-49af-4245-9d40-d7d64902055e"
      }
    ]
  }

  const fhirPrescription: fhir.Bundle = {
    resourceType: "Bundle",
    id: medicationRows[0].testId,
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

  const organisation = places.map(p => p.resource).find(r => r.resourceType === "Organization") as fhir.Organization
  const odsCode = organisation.identifier.find(i => i.system === "https://fhir.nhs.uk/Id/ods-organization-code").value
  const paddedOdsCode = pad(odsCode, 6)

  createMedicationRequests(
    medicationRows,
    paddedOdsCode,
    repeatsIssued,
    maxRepeatsAllowed
  ).forEach(medicationRequest =>
    fhirPrescription.entry.push(medicationRequest)
  )

  fhirPrescription.entry = [
    ...fhirPrescription.entry,
    ...places
  ]

  return fhirPrescription
}

function pad(value: string, size: number) {
  value = value.toString()
  while (value.length < size) value = "0" + value
  return value
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
