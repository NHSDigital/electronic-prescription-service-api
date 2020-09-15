import * as core from "../hl7-v3/hl7-v3-datatypes-core"
import {GlobalIdentifier} from "../hl7-v3/hl7-v3-datatypes-codes"
import {AgentPerson} from "../hl7-v3/hl7-v3-people-places"
import * as prescriptions from "../hl7-v3/hl7-v3-prescriptions"

export interface Fragments {
  time: core.Timestamp
  id: GlobalIdentifier
  agentPerson: AgentPerson
  recordTarget: prescriptions.RecordTarget
  pertinentLineItem: Array<prescriptions.LineItem>
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
