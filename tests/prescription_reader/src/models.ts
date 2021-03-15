export interface DisplayPrescription {
  courseOfTherapy: string
  numberOfRepeatPrescriptionsAllowed: string
  healthcareService: string
  organisationCode: string
  organisationAddressLines: string
  organisationCity: string
  organisationDistrict: string
  organisationPostalCode: string
}

export class Prescription {
  lines: PrescriptionLine[]

  constructor(lines: PrescriptionLine[]) {
    this.lines = lines
  }
}

export class PrescriptionLine {
  line: string
  
  constructor(line: string) {
    this.line = line
  }
}