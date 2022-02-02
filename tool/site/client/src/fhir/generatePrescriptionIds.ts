//Prescription ID check digits use a modified version of the ISO 7064, MOD 37-2 algorithm with "+" substituted for "*".
const CHECK_DIGIT_VALUES = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+"

export function generateShortFormIdFromExisting(originalShortFormId: string): string {
  const prescriberOdsCode = originalShortFormId.substring(7, 13)
  return generateShortFormId(prescriberOdsCode)
}

export function generateShortFormId(prescriberOdsCode: string): string {
  const a = generateRandomHexString(6)
  const b = prescriberOdsCode.padStart(6, "0")
  const c = generateRandomHexString(5)
  const checkDigit = calculateCheckDigit(a + b + c)
  return `${a}-${b}-${c}${checkDigit}`
}

export function validateShortFormId(input: string): boolean {
  const inputWithoutDelimiters = input.replace(/-/g, "")
  const inputWithoutCheckDigit = inputWithoutDelimiters.substring(0, inputWithoutDelimiters.length - 1)
  const checkDigit = inputWithoutDelimiters.substring(inputWithoutDelimiters.length - 1)
  return validateCheckDigit(inputWithoutCheckDigit, checkDigit)
}

function generateRandomHexString(length: number) {
  const randomNumbers = new Uint8Array(length)
  crypto.getRandomValues(randomNumbers)
  return Array.from(randomNumbers)
    .map(randomNumber => (randomNumber % 16).toString(16).toUpperCase())
    .join("")
}

function calculateCheckDigit(input: string) {
  const total = calculateTotalForCheckDigit(input)
  const checkDigitIndex = (38 - total) % 37
  return CHECK_DIGIT_VALUES.charAt(checkDigitIndex)
}

function validateCheckDigit(input: string, checkDigit: string) {
  const total = calculateTotalForCheckDigit(input)
  const checkDigitValue = CHECK_DIGIT_VALUES.indexOf(checkDigit)
  return (total + checkDigitValue) % 37 === 1
}

function calculateTotalForCheckDigit(input: string) {
  return Array.from(input)
    .map(charStr => parseInt(charStr, 36))
    .reduce((runningTotal, charInt) => ((runningTotal + charInt) * 2) % 37, 0)
}
