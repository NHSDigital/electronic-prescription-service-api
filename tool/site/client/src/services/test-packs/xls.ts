export interface XlsRow {
  [column: string]: string
}

export interface PatientRow {
  nhsNumber: string
  title: string
  familyName: string
  givenName: string
  otherGivenName: string
  postcode: string
}

export function parsePatientRows(rows: Array<XlsRow>): Array<PatientRow> {
  return rows.map(row => {
    return {
      nhsNumber: row["NHS_NUMBER"].toString(),
      title: row["TITLE"],
      familyName: row["FAMILY_NAME"],
      givenName: row["GIVEN_NAME"],
      otherGivenName: row["OTHER_GIVEN_NAME"],
      postcode: row["POST_CODE"]
    }
  })
}
