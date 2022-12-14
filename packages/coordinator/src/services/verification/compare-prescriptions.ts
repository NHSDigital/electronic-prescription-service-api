import {common} from "@models"

export function comparePrescriptions(p1: common.Prescription, p2: common.Prescription): Array<string> {
  // TODO: AEA-2645 + AEA-2524 - Add key fields to be compared
  const p1KeyValues = Object.entries(p1)
  const p2KeyValues = Object.entries(p2)
  return p1KeyValues.map((keyValue, index) => {
    if (keyValue[1] !== p2KeyValues[index][1]) {
      const camelCaseName = `${keyValue[0]}`
      const firstLetterUpperCase = camelCaseName.substring(0, 1).toUpperCase()
      const allOtherLetters = camelCaseName.substring(1)
      const pascalCaseName = `${firstLetterUpperCase}${allOtherLetters}`
      const titleCaseName = pascalCaseName.replace(/([A-Z])/g, " $1").trim()
      return `${titleCaseName} does not match`
    }
  }).filter(Boolean)
}
