/* eslint-disable max-len */
import {Dispatch, SetStateAction} from "react"
import * as XLSX from "xlsx"

export interface XlsRow {
  [column: string]: string | undefined
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getRowsFromSheet(sheetName: string, workbook: XLSX.WorkBook, required = true): any {
  const sheet = workbook.Sheets[sheetName]
  if (!sheet && required)
    throw new Error(`Could not find a sheet called '${sheetName}'`)
  //eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const rows = XLSX.utils.sheet_to_row_object_array(sheet)
  return rows
}

export interface PatientRow {
  testId: string
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

export function parsePatientRowsOrDefault(rows: Array<XlsRow>, prescriptionCount: number): Map<string, PatientRow> {
  const paitientsFromSheet = rows.map(row => {
    return {
      testId: row["Test ref"].toString(),
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
    return new Map(paitientsFromSheet.map(p => {
      return [p.testId, p]
    }))
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

  return fillDefaultMap(prescriptionCount, defaultPatientRow)
}

export interface PrescriberRow {
  testId: string
  prescriberName: string
  roleCode: string
  roleDescription: string
  telecom: string
  professionalCode: string
  professionalCodeType: string
  prescribingCode?: string
  prescribingCodeType?: string
}

export function parsePrescriberRowsOrDefault(rows: Array<XlsRow>, prescriptionCount: number): Map<string, PrescriberRow> {
  const prescribersFromSheet = rows.map(row => {
    return {
      testId: row["Test"].toString(),
      prescriberName: row["Prescriber Name"],
      roleCode: row["Role Code"],
      roleDescription: row["Role Description"],
      telecom: row["Telecom"],
      professionalCode: row["Professional Code"].toString(),
      professionalCodeType: row["Professional Code Type"],
      prescribingCode: row["Prescribing Code"]?.toString(),
      prescribingCodeType: row["Prescribing Code Type"]?.toString()
    }
  })

  if (prescribersFromSheet.length) {
    return new Map(prescribersFromSheet.map(p => {
      return [p.testId, p]
    }))
  }

  const defaultPrescriberRow = {
    prescriberName: "DR Thomas Edwards",
    roleCode: "S8000:G8000:R8000",
    roleDescription: "Clinical Practitioner Access Role",
    telecom: "0123456790",
    professionalCode: "C1234567",
    professionalCodeType: "GMC"
  }

  return fillDefaultMap(prescriptionCount, defaultPrescriberRow)
}

export interface OrganisationRow {
  testId: string
  odsCode: string
  roleCode: string
  roleName: string
  name: string
  address: Array<string>
  city: string
  district: string
  postcode: string
  telecom: string
}

export type AccountRow = OrganisationRow

export function parseOrganisationRowsOrDefault(rows: Array<XlsRow>, prescriptionCount: number): Map<string, OrganisationRow> {
  const organisationsFromSheet = getOrganisationFromRow(rows)

  if (organisationsFromSheet.length) {
    return new Map(organisationsFromSheet.map(o => {
      return [o.testId, o]
    }))
  }

  const defaultOrgRow = {
    odsCode: "A83003",
    roleCode: "76",
    roleName: "GP PRACTICE",
    name: "HALLGARTH SURGERY",
    address: ["HALLGARTH SURGERY", "CHEAPSIDE"],
    city: "SHILDON",
    district: "COUNTY DURHAM",
    postcode: "DL4 2HP",
    telecom: "0115 973720"
  }

  return fillDefaultMap(prescriptionCount, defaultOrgRow)
}

export function parseAccountRowsOrDefault(rows: Array<XlsRow>, prescriptionCount: number): Map<string, AccountRow> {
  const accountsFromSheet = getOrganisationFromRow(rows)

  if (accountsFromSheet.length) {
    return new Map(accountsFromSheet.map(a => {
      return [a.testId, a]
    }))
  }

  const defaultAccountRow = {
    odsCode: "84H",
    roleCode: "76",
    roleName: "GP PRACTICE",
    name: "HALLGARTH SURGERY",
    address: ["HALLGARTH SURGERY", "CHEAPSIDE"],
    city: "SHILDON",
    district: "COUNTY DURHAM",
    postcode: "DL4 2HP",
    telecom: "0115 973720"
  }

  return fillDefaultMap(prescriptionCount, defaultAccountRow)
}

function getOrganisationFromRow(rows: Array<XlsRow>) {
  return rows.map(row => {
    return {
      testId: row["Test"].toString(),
      odsCode: row["ODS Code"],
      roleCode: row["Role Code"].toString(),
      roleName: row["Role Name"],
      name: row["Name"],
      address: row["Address"].split(" ,"),
      city: row["City"],
      district: row["District"],
      postcode: row["Postcode"],
      telecom: row["Telecom"]
    }
  })
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
  repeatsAllowed: number
  issueDurationInDays: string
  dispenserNotes: Array<string>
  nominatedPharmacy?: string
  nominatedPharmacyType: string
  controlledDrugSchedule: string
  controlledDrugQuantity: string
  additionalInstructions: string
  startDate?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parsePrescriptionRows(rows: Array<XlsRow>, setLoadPageErrors: Dispatch<SetStateAction<any>>): Array<PrescriptionRow> {
  const errors: Array<string> = []

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
    const prescriptionType = row["Prescription Type"].toString()

    const rowData: PrescriptionRow = {
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
        : "As Directed",
      repeatsAllowed: parseInt(row["Number of Issues"]) - 1,
      issueDurationInDays: row["Issue Duration"],
      dispenserNotes: row["Dispenser Notes"]?.split("\n") ?? [],
      nominatedPharmacy: row["Nominated Pharmacy"],
      nominatedPharmacyType: row["Nominated Pharmacy Type"],
      controlledDrugSchedule: row["Controlled Drug Schedule"],
      controlledDrugQuantity: row["Controlled Drug Quantity"],
      additionalInstructions: row["Patient additional Instructions"],
      startDate: row["Start Date"]
    }

    return rowData
  })
}

function validateColumnExists(rows: Array<XlsRow>, columnName: string, description: string, errors: Array<string>) {
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
    default:
      return "Unknown"
  }
}

function fillDefaultMap(prescriptionCount: number, defaultEntry: unknown) {
  let index = 1
  const defaults = Array(prescriptionCount).fill(defaultEntry)
  return new Map(defaults.map(d => {
    return [(index++).toString(), d]
  }))
}
