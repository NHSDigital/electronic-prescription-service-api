import * as uuid from "uuid"

export function shortPrescId() {
  const _PRESC_CHECKDIGIT_VALUES = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+"
  const hexString = uuid.v4().replace(/-/g, "").toUpperCase()
  const first = hexString.substring(0, 6)
  const middle ="A12345"
  const last = hexString.substring(12, 17)
  let prescriptionID = `${first}-${middle}-${last}`
  const prscID = prescriptionID.replace(/-/g, "")
  const prscIDLength = prscID.length
  let runningTotal = 0
  const strings = prscID.split("")
  strings.forEach((character, index) => {
    runningTotal = runningTotal + parseInt(character, 36) * 2 ** (prscIDLength - index)
  })
  const checkValue = (38 - (runningTotal % 37)) % 37
  const checkDigit = _PRESC_CHECKDIGIT_VALUES.substring(checkValue, checkValue + 1)
  prescriptionID += checkDigit
  return prescriptionID
}
