import {Dispatch, SetStateAction} from "react"
import * as XLSX from "xlsx"

export interface XlsRow {
  [column: string]: string
}

export function getRowsFromSheet(sheetName: string, workbook: XLSX.WorkBook, required = true): any {
  const sheet = workbook.Sheets[sheetName]
  if (!sheet && required)
    throw new Error(`Could not find a sheet called '${sheetName}'`)
  //eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const rows = XLSX.utils.sheet_to_row_object_array(sheet)
  return rows
}

export function createNominatedPharmacies(rows: Array<XlsRow>): Array<string> {
  return rows.map(row => row["ODS Code"])
}

export interface PatientRow {
  nhsNumber: string
  title: string
  familyName: string
  givenName: string
  otherGivenName: string
  gender: string
  dateOfBirth: string
  addressLine1: string
  addressLine2: string
  addressLine3: string
  addressLine4: string
  postcode: string
}

export function parsePatientRowsOrDefault(rows: Array<XlsRow>, prescriptionCount: number): Array<PatientRow> {
  const paitientsFromSheet = rows.map(row => {
    return {
      nhsNumber: row["NHS_NUMBER"].toString(),
      title: row["TITLE"],
      familyName: row["FAMILY_NAME"],
      givenName: row["GIVEN_NAME"],
      otherGivenName: row["OTHER_GIVEN_NAME"],
      gender: row["GENDER"].toLowerCase(),
      dateOfBirth: row["DATE_OF_BIRTH"].toString(),
      addressLine1: row["ADDRESS_LINE_1"],
      addressLine2: row["ADDRESS_LINE_2"],
      addressLine3: row["ADDRESS_LINE_3"],
      addressLine4: row["ADDRESS_LINE_4"],
      postcode: row["POST_CODE"]
    }
  })

  if (paitientsFromSheet.length) {
    return paitientsFromSheet
  }

  const defaultPatientRow = {
    nhsNumber: "9990548609",
    title: "MR",
    familyName: "XXTESTPATIENT-TGNP",
    givenName: "DONOTUSE",
    otherGivenName: null,
    gender: "male",
    dateOfBirth: "19320106",
    addressLine1: "1 Trevelyan Square",
    addressLine2: "Boar Lane",
    addressLine3: "Leeds",
    addressLine4: "West Yorkshire",
    postcode: "LS1 6AE"
  }

  return Array(prescriptionCount).fill(defaultPatientRow)
}

export interface PrescriptionRow {
  testId: string
  prescriptionTreatmentTypeCode: string
  prescriptionTypeCode: string
  prescriptionTypeDescription: string
  medicationName: string
  medicationSnomed: string
  medicationQuantity: string
  medicationUnitOfMeasureName: string
  medicationUnitOfMeasureCode: string
  dosageInstructions: string
  endorsements: string
  repeatsAllowed: number,
  issueDurationInDays: string

}

export function parsePrescriptionRows(rows: Array<XlsRow>, setLoadPageErrors: Dispatch<SetStateAction<any>>): Array<PrescriptionRow> {
  const errors: Array<string> = []
  // todo: check this is comprehensive...
  validateColumnExists(rows, "Test", "the test number e.g. 1, 2, 3", errors)
  validateColumnExists(
    rows,
    "Treatment Type", "the treatment type of a prescription e.g. acute, repeat-prescribing, repeat-dispensing",
    errors
  )
  validateColumnExists(rows, "Medication", "medication items for a prescription test", errors)
  validateColumnExists(rows, "Medication Snomed", "a medication item's snomed code", errors)
  validateColumnExists(rows, "Quantity", "the number of medication units to prescribe", errors)
  validateColumnExists(rows, "Unit of Measure", "the unit of measure for the medication item e.g. ml, dose", errors)
  validateColumnExists(rows, "Unit of Measure Snomed", "the unit of measure for the medication item e.g. ml, dose", errors)
  validateColumnExists(rows, "Number of Issues", "the number of issues inclusive of the original prescription allowed", errors)
  validateColumnExists(rows, "Issue Duration", "the number of days an issue is expected to last", errors)

  if (errors.length) {
    setLoadPageErrors({details: errors})
  }

  return rows.map(row => {
    const prescriptionType = row["Prescription Type"]
    return {
      testId: row["Test"].toString(),
      prescriptionTreatmentTypeCode: row["Treatment Type"],
      prescriptionTypeCode: prescriptionType,
      prescriptionTypeDescription: getPrescriberDescription(prescriptionType),
      medicationName: row["Medication"],
      medicationSnomed: row["Medication Snomed"].toString(),
      medicationQuantity: row["Quantity"],
      medicationUnitOfMeasureName: row["Unit of Measure"],
      medicationUnitOfMeasureCode: row["Unit of Measure Snomed"],
      endorsements: row["Endorsements"],
      dosageInstructions: row["Dosage Instructions"]
        ? row["Dosage Instructions"]
        : "As directed",
      repeatsAllowed: parseInt(row["Number of Issues"]) - 1,
      issueDurationInDays: row["Issue Duration"]
    }
  })
}

function validateColumnExists(rows: XlsRow[], columnName: string, description: string, errors: Array<string>) {
  if (!rows[0][columnName]) {
    errors.push(`Must provide a column named: '${columnName}' which identifies ${description}`)
  }
}

function getPrescriberDescription(prescriberType: string): string {
  switch (prescriberType) {
    case "0101":
      return "Primary Care Prescriber - Medical Prescriber"
    case "0104":
      return "Primary Care Prescriber - Nurse Independent/Supplementary prescriber"
    case "0105":
      return "Primary Care Prescriber - Community Practitioner Nurse prescriber"
    case "0108":
      return "Primary Care Prescriber - Pharmacist Independent/Supplementary prescriber"
    case "0125":
      return "Primary Care Prescriber - Paramedic Independent/Supplementary prescriber"
  }
}
