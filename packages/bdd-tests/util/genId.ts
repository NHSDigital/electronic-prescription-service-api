import * as crypto from "crypto"
let lastNumber
export function shortPrescId() {
  const random6 = gen6RandomNumber().toString().slice(0, 6)
  let id = random6 + "A830082EFE3"
  id = id + calculateCheckDigit(id)
  return id.substring(0, 6) + "-" + id.substring(6, 12) + "-" + id.substring(12, 22)
}

function gen6RandomNumber() {
  const minm = 100000
  const maxm = 999999
  const array = new Uint32Array(1)
  return Math.floor(crypto.getRandomValues(array) * (maxm - minm + 1)) + minm
}

function calculateCheckDigit(input) {
  const CHECK_DIGIT_VALUES = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+"
  const total = calculateTotalForCheckDigit(input)
  const checkDigitIndex = (38 - total) % 37
  return CHECK_DIGIT_VALUES.charAt(checkDigitIndex)
}

function calculateTotalForCheckDigit(input) {
  return Array.from(input)
    .map(charStr => parseInt(charStr, 36))
    .reduce((runningTotal, charInt) => ((runningTotal + charInt) * 2) % 37, 0)
}

function getRandomUUID() {
  const x = crypto.randomUUID() // get new random number

  if (x === lastNumber) { // compare with last number
    return getRandomUUID() // if they are the same, call the function again to repeat the process
  }
  return x // if they're not the same, return it
}
export function generateRandomUUID() {
  const number = getRandomUUID()
  lastNumber = number
  return number
}
