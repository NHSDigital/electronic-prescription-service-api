import React from "react"
import {PrescriptionGroupTable} from "./prescriptionGroupTable"

export interface Prescriptions {
  sentPrescriptions: Array<string>
  releasedPrescriptions: Array<string>
  dispensedPrescriptions: Array<string>
  claimedPrescriptions: Array<string>
}

export const MyPrescriptions : React.FC<Prescriptions> = prescriptions => {
  return (
    <>
      <PrescriptionGroupTable
        name="Sent Prescriptions"
        description="Prescriptions created and sent"
        prescriptions={prescriptions.sentPrescriptions}
        actions={{view: true, release: true}}
      />
      <PrescriptionGroupTable
        name="Released Prescriptions"
        description="Prescriptions which have been downloaded"
        prescriptions={prescriptions.releasedPrescriptions}
        actions={{view: true, verify: true, releaseReturn: true, dispense: true}}
      />
      <PrescriptionGroupTable
        name="Dispensed Prescriptions"
        description="Partially and fully dispensed prescriptions"
        prescriptions={prescriptions.dispensedPrescriptions}
        actions={{view: true, dispense: true, withdraw: true, claim: true}}
      />
      <PrescriptionGroupTable
        name="Claimed Prescriptions"
        description="Prescriptions which have been claimed for"
        prescriptions={prescriptions.claimedPrescriptions}
        actions={{view: true, claimAmend: true}}
      />
    </>
  )
}

export default MyPrescriptions
