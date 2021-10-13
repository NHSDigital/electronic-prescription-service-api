import {StringKeyedObject} from "./helpers"

export function createNominatedPharmacies(rows: Array<StringKeyedObject>): Array<string> {
  return rows.map(row => row["ODS Code"])
}
