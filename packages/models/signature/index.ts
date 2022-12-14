import * as hl7V3 from "../hl7-v3"

export interface Fragments {
  time: hl7V3.Timestamp
  id: hl7V3.GlobalIdentifier
  agentPerson: hl7V3.AgentPerson
  recordTarget: hl7V3.RecordTarget
  pertinentLineItem: Array<hl7V3.LineItem>
}

export interface Display {
  prescriptionStartDate: string
  patientName: string
  patientDob: string
  patientGender: string
  patientNhsNumber: string
  patientAddress: string
  prescriberName: string
  prescriberCode: string
  prescriberOrg: string
  prescriberAddress: string
  medication: Array<DisplayMedication>
}

export class DisplayMedication {
  public constructor(init?:Partial<DisplayMedication>) {
    Object.assign(this, init)
  }

  name: string
  quantity: string
  dose: string
}
