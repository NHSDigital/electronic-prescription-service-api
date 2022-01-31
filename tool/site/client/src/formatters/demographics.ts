import {Address, HumanName} from "fhir/r4"

export function formatName(name: HumanName): string {
  if (name.text) {
    return name.text
  }

  const otherNameFields = [
    name.given,
    name.prefix?.map(prefix => `(${prefix})`),
    name.suffix?.map(suffix => `(${suffix})`)
  ].flat().filter(Boolean).join(" ")

  return [
    name.family?.toUpperCase(),
    otherNameFields
  ].filter(Boolean).join(", ")
}

export function getAllAddressLines(address: Address): Array<string> {
  if (address.text) {
    return [address.text]
  }

  return [
    address.line,
    address.city,
    address.district,
    address.state,
    address.postalCode,
    address.country
  ].flat().filter(Boolean)
}

export function formatNhsNumber(nhsNumber: string): string {
  return `${nhsNumber.substring(0, 3)} ${nhsNumber.substring(3, 6)} ${nhsNumber.substring(6)}`
}

export function formatGender(gender: "male" | "female" | "other" | "unknown"): string {
  return gender.substring(0, 1).toUpperCase() + gender.substring(1)
}
